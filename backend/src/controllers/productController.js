const { pool } = require('../config/database');

const getAllProducts = async (req, res) => {
  try {
    const { search, categoryID, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    let where = ['p.status = "active"'];
    let params = [];

    if (search) { where.push('p.productName LIKE ?'); params.push(`%${search}%`); }
    if (categoryID) { where.push('p.categoryID = ?'); params.push(categoryID); }
    if (minPrice) { where.push('p.price >= ?'); params.push(minPrice); }
    if (maxPrice) { where.push('p.price <= ?'); params.push(maxPrice); }

    const limitNum = parseInt(limit);
    const offsetNum = (parseInt(page) - 1) * limitNum;
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [products] = await pool.execute(
      `SELECT p.*, c.categoryName, i.stockQuantity as inventoryQty
       FROM products p
       LEFT JOIN categories c ON p.categoryID = c.categoryID
       LEFT JOIN inventory i ON p.productID = i.productID
       ${whereClause} ORDER BY p.createdAt DESC LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`, params
    );

    res.json({ success: true, products, total, page: parseInt(page), pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, c.categoryName, i.stockQuantity as inventoryQty
       FROM products p
       LEFT JOIN categories c ON p.categoryID = c.categoryID
       LEFT JOIN inventory i ON p.productID = i.productID
       WHERE p.productID = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { productName, description, price, stockQuantity, categoryID, imageUrl } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO products (productName, description, price, stockQuantity, categoryID, imageUrl) VALUES (?,?,?,?,?,?)',
      [productName, description, price, stockQuantity || 0, categoryID, imageUrl]
    );
    await pool.execute('INSERT INTO inventory (productID, stockQuantity) VALUES (?,?)', [result.insertId, stockQuantity || 0]);
    res.status(201).json({ success: true, message: 'Product created', productID: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productName, description, price, stockQuantity, categoryID, imageUrl, status } = req.body;
    await pool.execute(
      'UPDATE products SET productName=?, description=?, price=?, stockQuantity=?, categoryID=?, imageUrl=?, status=? WHERE productID=?',
      [productName, description, price, stockQuantity, categoryID, imageUrl, status || 'active', req.params.id]
    );
    await pool.execute('UPDATE inventory SET stockQuantity=? WHERE productID=?', [stockQuantity, req.params.id]);
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await pool.execute('UPDATE products SET status="inactive" WHERE productID=?', [req.params.id]);
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM categories ORDER BY categoryName');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories };
