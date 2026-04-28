const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./database');
const { createTables } = require('./schema');

const seedData = async () => {
  await testConnection();
  await createTables();

  // Categories
  await pool.execute(`INSERT IGNORE INTO categories (categoryID, categoryName, description) VALUES
    (1, 'Electronics', 'Electronic devices and accessories'),
    (2, 'Clothing', 'Fashion and apparel'),
    (3, 'Books', 'Books and educational materials'),
    (4, 'Home & Kitchen', 'Home appliances and kitchenware'),
    (5, 'Sports', 'Sports and outdoor equipment')`);

  // Users - only 4 roles now: admin, customer, warehouse, delivery
  const hash = await bcrypt.hash('password123', 10);
  const users = [
    [1, 'Admin User', 'admin@store.com', hash, '0900000001', '123 Admin St', 'admin'],
    [2, 'Customer Linh', 'customer@store.com', hash, '0912345678', '789 Customer Rd, Ha Noi', 'customer'],
    [3, 'Customer Minh', 'minh@store.com', hash, '0923456789', '321 Minh St, Ho Chi Minh', 'customer'],
    [4, 'Warehouse Staff Hung', 'warehouse@store.com', hash, '0934567890', 'Warehouse District', 'warehouse'],
    [5, 'Delivery Staff Duc', 'delivery@store.com', hash, '0945678901', 'Delivery Base', 'delivery'],
  ];

  for (const u of users) {
    await pool.execute(
      `INSERT IGNORE INTO users (userID, fullName, email, password, phone, address, role) VALUES (?,?,?,?,?,?,?)`, u
    );
  }

  // Products
  const products = [
    [1, 'iPhone 15 Pro', 'Latest Apple smartphone with titanium design', 28990000, 50, 1, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'],
    [2, 'Samsung Galaxy S24', 'Flagship Android smartphone', 22990000, 35, 1, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'],
    [3, 'MacBook Air M3', 'Ultra-thin laptop with M3 chip', 32990000, 20, 1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
    [4, 'Sony WH-1000XM5', 'Premium noise-cancelling headphones', 8990000, 60, 1, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400'],
    [5, 'Nike Air Max 270', 'Stylish running shoes', 3290000, 80, 2, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
    [6, 'Adidas Ultraboost 22', 'Performance running shoes', 4490000, 65, 2, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400'],
    [7, 'Clean Code - R. Martin', 'A handbook of agile software craftsmanship', 450000, 100, 3, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'],
    [8, 'Design Patterns', 'Elements of reusable object-oriented software', 520000, 75, 3, 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400'],
    [9, 'Instant Pot Duo 7-in-1', 'Multi-use pressure cooker', 2890000, 40, 4, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400'],
    [10, 'Yoga Mat Premium', 'Non-slip exercise yoga mat', 790000, 90, 5, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
  ];

  for (const p of products) {
    await pool.execute(
      `INSERT IGNORE INTO products (productID, productName, description, price, stockQuantity, categoryID, imageUrl) VALUES (?,?,?,?,?,?,?)`, p
    );
    await pool.execute(
      `INSERT IGNORE INTO inventory (productID, stockQuantity) VALUES (?, ?)`, [p[0], p[4]]
    );
  }

  // Sample orders (customerID adjusted: Linh=2, Minh=3, warehouse=4, delivery=5)
  await pool.execute(`INSERT IGNORE INTO orders (orderID, customerID, status, totalAmount, shippingAddress, shippingPhone, assignedStaffID) VALUES
    (1, 2, 'delivered', 28990000, '789 Customer Rd, Ha Noi', '0912345678', 4),
    (2, 2, 'shipped', 8990000, '789 Customer Rd, Ha Noi', '0912345678', 5),
    (3, 3, 'paid', 3740000, '321 Minh St, Ho Chi Minh', '0923456789', 4),
    (4, 2, 'created', 970000, '789 Customer Rd, Ha Noi', '0912345678', NULL)`);

  await pool.execute(`INSERT IGNORE INTO order_items (orderItemID, orderID, productID, quantity, price) VALUES
    (1, 1, 1, 1, 28990000),
    (2, 2, 4, 1, 8990000),
    (3, 3, 5, 1, 3290000), (4, 3, 10, 1, 450000),
    (5, 4, 7, 1, 450000), (6, 4, 10, 1, 520000)`);

  await pool.execute(`INSERT IGNORE INTO payments (paymentID, orderID, amount, paymentMethod, paymentStatus, transactionRef, paidAt) VALUES
    (1, 1, 28990000, 'credit_card', 'successful', 'TXN-001', NOW()),
    (2, 2, 8990000, 'e_wallet', 'successful', 'TXN-002', NOW()),
    (3, 3, 3740000, 'bank_transfer', 'successful', 'TXN-003', NOW())`);

  await pool.execute(`INSERT IGNORE INTO invoices (invoiceID, orderID, totalAmount) VALUES
    (1, 1, 28990000),
    (2, 2, 8990000),
    (3, 3, 3740000)`);

  await pool.execute(`INSERT IGNORE INTO shipments (shipmentID, orderID, deliveryStatus, shippingAddress, deliveryStaffID, deliveredAt) VALUES
    (1, 1, 'delivered', '789 Customer Rd, Ha Noi', 5, NOW()),
    (2, 2, 'in_transit', '789 Customer Rd, Ha Noi', 5, NULL),
    (3, 3, 'pending', '321 Minh St, Ho Chi Minh', NULL, NULL)`);

  console.log('✅ Seed data inserted successfully');
  console.log('\n📋 Demo Accounts (password: password123):');
  console.log('  admin@store.com       → Admin (Quản trị + Quản lý)');
  console.log('  customer@store.com    → Customer');
  console.log('  warehouse@store.com   → Warehouse Staff');
  console.log('  delivery@store.com    → Delivery Staff');
  process.exit(0);
};

seedData().catch(e => { console.error(e); process.exit(1); });
