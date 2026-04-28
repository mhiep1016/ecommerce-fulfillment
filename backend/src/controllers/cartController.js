const { pool } = require('../config/database');

const getCart = async (req, res) => {
  try {
    const customerID = req.user.userID;

    // Ensure cart exists
    let [cartRows] = await pool.execute('SELECT * FROM carts WHERE customerID = ?', [customerID]);
    if (!cartRows.length) {
      await pool.execute('INSERT INTO carts (customerID) VALUES (?)', [customerID]);
      [cartRows] = await pool.execute('SELECT * FROM carts WHERE customerID = ?', [customerID]);
    }
    const cart = cartRows[0];

    const [items] = await pool.execute(
      `SELECT ci.*, p.productName, p.price, p.imageUrl, p.stockQuantity, i.stockQuantity as inventoryQty
       FROM cart_items ci
       JOIN products p ON ci.productID = p.productID
       LEFT JOIN inventory i ON p.productID = i.productID
       WHERE ci.cartID = ?`,
      [cart.cartID]
    );

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ success: true, cart: { ...cart, items, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productID, quantity = 1 } = req.body;
    const customerID = req.user.userID;

    const [product] = await pool.execute('SELECT * FROM products WHERE productID = ? AND status = "active"', [productID]);
    if (!product.length) return res.status(404).json({ success: false, message: 'Product not found' });

    const [inv] = await pool.execute('SELECT stockQuantity FROM inventory WHERE productID = ?', [productID]);
    const stock = inv.length ? inv[0].stockQuantity : product[0].stockQuantity;
    if (stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    let [cartRows] = await pool.execute('SELECT cartID FROM carts WHERE customerID = ?', [customerID]);
    if (!cartRows.length) {
      await pool.execute('INSERT INTO carts (customerID) VALUES (?)', [customerID]);
      [cartRows] = await pool.execute('SELECT cartID FROM carts WHERE customerID = ?', [customerID]);
    }
    const cartID = cartRows[0].cartID;

    const [existing] = await pool.execute('SELECT * FROM cart_items WHERE cartID = ? AND productID = ?', [cartID, productID]);
    if (existing.length) {
      await pool.execute('UPDATE cart_items SET quantity = quantity + ? WHERE cartID = ? AND productID = ?', [quantity, cartID, productID]);
    } else {
      await pool.execute('INSERT INTO cart_items (cartID, productID, quantity) VALUES (?,?,?)', [cartID, productID, quantity]);
    }

    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemID } = req.params;
    if (quantity <= 0) {
      await pool.execute('DELETE FROM cart_items WHERE cartItemID = ?', [itemID]);
    } else {
      await pool.execute('UPDATE cart_items SET quantity = ? WHERE cartItemID = ?', [quantity, itemID]);
    }
    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    await pool.execute('DELETE FROM cart_items WHERE cartItemID = ?', [req.params.itemID]);
    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
