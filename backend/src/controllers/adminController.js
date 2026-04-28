const { pool } = require('../config/database');

// ── REPORTS ──────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [[revenue]] = await pool.execute(`SELECT COALESCE(SUM(amount),0) as totalRevenue FROM payments WHERE paymentStatus='successful'`);
    const [[orders]] = await pool.execute(`SELECT COUNT(*) as totalOrders FROM orders`);
    const [[customers]] = await pool.execute(`SELECT COUNT(*) as totalCustomers FROM users WHERE role='customer'`);
    const [[pending]] = await pool.execute(`SELECT COUNT(*) as pendingOrders FROM orders WHERE status IN ('paid','packaged')`);
    const [[lowStock]] = await pool.execute(`SELECT COUNT(*) as lowStockItems FROM inventory WHERE stockQuantity < 10`);

    const [recentOrders] = await pool.execute(
      `SELECT o.orderID, o.status, o.totalAmount, o.orderDate, u.fullName as customerName
       FROM orders o JOIN users u ON o.customerID = u.userID ORDER BY o.orderDate DESC LIMIT 5`
    );

    const [statusBreakdown] = await pool.execute(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    );

    const [revenueByDay] = await pool.execute(
      `SELECT DATE(paidAt) as date, SUM(amount) as revenue
       FROM payments WHERE paymentStatus='successful' AND paidAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(paidAt) ORDER BY date`
    );

    res.json({
      success: true,
      stats: {
        totalRevenue: revenue.totalRevenue,
        totalOrders: orders.totalOrders,
        totalCustomers: customers.totalCustomers,
        pendingOrders: pending.pendingOrders,
        lowStockItems: lowStock.lowStockItems
      },
      recentOrders,
      statusBreakdown,
      revenueByDay
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const [items] = await pool.execute(
      `SELECT p.productID, p.productName, c.categoryName, i.stockQuantity, p.price,
              CASE WHEN i.stockQuantity = 0 THEN 'out_of_stock' WHEN i.stockQuantity < 10 THEN 'low' ELSE 'ok' END as stockStatus
       FROM inventory i JOIN products p ON i.productID = p.productID
       LEFT JOIN categories c ON p.categoryID = c.categoryID
       WHERE p.status = 'active' ORDER BY i.stockQuantity ASC`
    );
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── USER MANAGEMENT ──────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT userID, fullName, email, phone, role, status, createdAt FROM users ORDER BY createdAt DESC'
    );
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { fullName, email, password, phone, address, role } = req.body;
    const [existing] = await pool.execute('SELECT userID FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password || 'password123', 10);
    const [result] = await pool.execute(
      'INSERT INTO users (fullName, email, password, phone, address, role) VALUES (?,?,?,?,?,?)',
      [fullName, email, hashed, phone, address, role || 'customer']
    );
    if (role === 'customer' || !role) {
      await pool.execute('INSERT INTO carts (customerID) VALUES (?)', [result.insertId]);
    }
    res.status(201).json({ success: true, message: 'User created', userID: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullName, phone, address, role, status } = req.body;
    await pool.execute(
      'UPDATE users SET fullName=?, phone=?, address=?, role=?, status=? WHERE userID=?',
      [fullName, phone, address, role, status, req.params.id]
    );
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await pool.execute('UPDATE users SET status="inactive" WHERE userID=?', [req.params.id]);
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── WAREHOUSE ─────────────────────────────────────────────
const getWarehouseOrders = async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, u.fullName as customerName, u.phone as customerPhone
       FROM orders o JOIN users u ON o.customerID = u.userID
       WHERE o.status IN ('paid','packaged') ORDER BY o.orderDate ASC`
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

// ── DELIVERY ─────────────────────────────────────────────
const getDeliveryOrders = async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, u.fullName as customerName, u.phone as customerPhone, s.deliveryStatus, s.shipmentID, s.attemptCount
       FROM orders o
       JOIN users u ON o.customerID = u.userID
       JOIN shipments s ON o.orderID = s.orderID
       WHERE o.status IN ('packaged','shipped') ORDER BY o.updatedAt ASC`
    );
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reportDeliveryIssue = async (req, res) => {
  try {
    const { notes } = req.body;
    const { id } = req.params;
    const [ship] = await pool.execute('SELECT * FROM shipments WHERE shipmentID = ?', [id]);
    if (!ship.length) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const newCount = ship[0].attemptCount + 1;
    if (newCount >= 3) {
      await pool.execute('UPDATE shipments SET deliveryStatus="failed", attemptCount=?, notes=? WHERE shipmentID=?', [newCount, notes, id]);
      await pool.execute('UPDATE orders SET status="cancelled" WHERE orderID=?', [ship[0].orderID]);
      return res.json({ success: true, message: 'Order cancelled after 3 failed attempts' });
    }

    await pool.execute('UPDATE shipments SET attemptCount=?, notes=? WHERE shipmentID=?', [newCount, notes, id]);
    res.json({ success: true, message: `Attempt ${newCount} recorded. ${3 - newCount} attempts remaining.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats, getInventoryReport,
  getAllUsers, createUser, updateUser, deleteUser,
  getWarehouseOrders, getDeliveryOrders, reportDeliveryIssue
};
