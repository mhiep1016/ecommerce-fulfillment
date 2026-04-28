const { pool } = require('../config/database');

const placeOrder = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { shippingAddress, shippingPhone, paymentMethod, notes } = req.body;
    const customerID = req.user.userID;

    // Get cart
    const [cartRows] = await conn.execute('SELECT cartID FROM carts WHERE customerID = ?', [customerID]);
    if (!cartRows.length) return res.status(400).json({ success: false, message: 'Cart not found' });
    const cartID = cartRows[0].cartID;

    const [items] = await conn.execute(
      `SELECT ci.*, p.price, p.productName FROM cart_items ci JOIN products p ON ci.productID = p.productID WHERE ci.cartID = ?`,
      [cartID]
    );
    if (!items.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

    // Validate stock
    for (const item of items) {
      const [inv] = await conn.execute('SELECT stockQuantity FROM inventory WHERE productID = ? FOR UPDATE', [item.productID]);
      if (!inv.length || inv[0].stockQuantity < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${item.productName}` });
      }
    }

    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);

    // Create order
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (customerID, status, totalAmount, shippingAddress, shippingPhone, notes) VALUES (?,?,?,?,?,?)',
      [customerID, 'created', totalAmount, shippingAddress, shippingPhone, notes]
    );
    const orderID = orderResult.insertId;

    // Insert order items & deduct inventory
    for (const item of items) {
      await conn.execute('INSERT INTO order_items (orderID, productID, quantity, price) VALUES (?,?,?,?)', [orderID, item.productID, item.quantity, item.price]);
      await conn.execute('UPDATE inventory SET stockQuantity = stockQuantity - ? WHERE productID = ?', [item.quantity, item.productID]);
      await conn.execute('UPDATE products SET stockQuantity = stockQuantity - ? WHERE productID = ?', [item.quantity, item.productID]);
    }

    // Create payment record
    await conn.execute('INSERT INTO payments (orderID, amount, paymentMethod, paymentStatus) VALUES (?,?,?,?)', [orderID, totalAmount, paymentMethod || 'bank_transfer', 'pending']);

    // Create shipment record
    await conn.execute('INSERT INTO shipments (orderID, deliveryStatus, shippingAddress) VALUES (?,?,?)', [orderID, 'pending', shippingAddress]);

    // Clear cart
    await conn.execute('DELETE FROM cart_items WHERE cartID = ?', [cartID]);

    await conn.commit();
    res.status(201).json({ success: true, message: 'Order placed successfully', orderID });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

const processPayment = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { action } = req.body; // 'success' or 'fail'

    const [orders] = await pool.execute('SELECT * FROM orders WHERE orderID = ? AND customerID = ?', [orderID, req.user.userID]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });
    if (orders[0].status !== 'created' && orders[0].status !== 'pending_payment') {
      return res.status(400).json({ success: false, message: 'Order cannot be paid at this stage' });
    }

    if (action === 'success') {
      await pool.execute('UPDATE orders SET status = "paid" WHERE orderID = ?', [orderID]);
      await pool.execute('UPDATE payments SET paymentStatus = "successful", transactionRef = ?, paidAt = NOW() WHERE orderID = ?', [`TXN-${Date.now()}`, orderID]);
      await pool.execute('INSERT IGNORE INTO invoices (orderID, totalAmount) VALUES (?,?)', [orderID, orders[0].totalAmount]);
      res.json({ success: true, message: 'Payment successful' });
    } else {
      await pool.execute('UPDATE orders SET status = "created" WHERE orderID = ?', [orderID]);
      await pool.execute('UPDATE payments SET paymentStatus = "failed" WHERE orderID = ?', [orderID]);
      res.json({ success: false, message: 'Payment failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, p.paymentStatus, p.paymentMethod, s.deliveryStatus
       FROM orders o
       LEFT JOIN payments p ON o.orderID = p.orderID
       LEFT JOIN shipments s ON o.orderID = s.orderID
       WHERE o.customerID = ? ORDER BY o.orderDate DESC`,
      [req.user.userID]
    );

    for (const order of orders) {
      const [items] = await pool.execute(
        `SELECT oi.*, p.productName, p.imageUrl FROM order_items oi JOIN products p ON oi.productID = p.productID WHERE oi.orderID = ?`,
        [order.orderID]
      );
      order.items = items;
    }
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, u.fullName as customerName, u.email as customerEmail, p.paymentStatus, p.paymentMethod, p.paidAt, s.deliveryStatus, s.shipmentDate, s.deliveredAt
       FROM orders o
       LEFT JOIN users u ON o.customerID = u.userID
       LEFT JOIN payments p ON o.orderID = p.orderID
       LEFT JOIN shipments s ON o.orderID = s.orderID
       WHERE o.orderID = ?`,
      [req.params.id]
    );
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });

    const [items] = await pool.execute(
      `SELECT oi.*, p.productName, p.imageUrl FROM order_items oi JOIN products p ON oi.productID = p.productID WHERE oi.orderID = ?`,
      [req.params.id]
    );
    orders[0].items = items;
    res.json({ success: true, order: orders[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let where = [];
    let params = [];
    if (status) { where.push('o.status = ?'); params.push(status); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;

    const [orders] = await pool.execute(
      `SELECT o.*, u.fullName as customerName, p.paymentStatus, p.paymentMethod, s.deliveryStatus
       FROM orders o
       LEFT JOIN users u ON o.customerID = u.userID
       LEFT JOIN payments p ON o.orderID = p.orderID
       LEFT JOIN shipments s ON o.orderID = s.orderID
       ${whereClause} ORDER BY o.orderDate DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM orders o ${whereClause}`, params);
    res.json({ success: true, orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['created','pending_payment','paid','packaged','shipped','delivered','cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const [orders] = await pool.execute('SELECT * FROM orders WHERE orderID = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });

    const order = orders[0];
    if (['delivered','cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order is locked and cannot be modified' });
    }

    await pool.execute('UPDATE orders SET status = ? WHERE orderID = ?', [status, req.params.id]);

    if (status === 'shipped') {
      await pool.execute('UPDATE shipments SET deliveryStatus = "in_transit", shipmentDate = NOW() WHERE orderID = ?', [req.params.id]);
    } else if (status === 'delivered') {
      await pool.execute('UPDATE shipments SET deliveryStatus = "delivered", deliveredAt = NOW() WHERE orderID = ?', [req.params.id]);
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [orders] = await conn.execute('SELECT * FROM orders WHERE orderID = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });

    const order = orders[0];
    if (['delivered','cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    // Restore inventory
    const [items] = await conn.execute('SELECT * FROM order_items WHERE orderID = ?', [order.orderID]);
    for (const item of items) {
      await conn.execute('UPDATE inventory SET stockQuantity = stockQuantity + ? WHERE productID = ?', [item.quantity, item.productID]);
      await conn.execute('UPDATE products SET stockQuantity = stockQuantity + ? WHERE productID = ?', [item.quantity, item.productID]);
    }

    await conn.execute('UPDATE orders SET status = "cancelled" WHERE orderID = ?', [order.orderID]);
    await conn.commit();
    res.json({ success: true, message: 'Order cancelled and inventory restored' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

module.exports = { placeOrder, processPayment, getMyOrders, getOrder, getAllOrders, updateOrderStatus, cancelOrder };
