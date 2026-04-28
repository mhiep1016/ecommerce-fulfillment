const { pool } = require('./database');

const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS categories (
      categoryID INT AUTO_INCREMENT PRIMARY KEY,
      categoryName VARCHAR(100) NOT NULL,
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS users (
      userID INT AUTO_INCREMENT PRIMARY KEY,
      fullName VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      role ENUM('customer','warehouse','delivery','admin') DEFAULT 'customer',
      status ENUM('active','inactive') DEFAULT 'active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS products (
      productID INT AUTO_INCREMENT PRIMARY KEY,
      productName VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      stockQuantity INT DEFAULT 0,
      categoryID INT,
      imageUrl VARCHAR(500),
      status ENUM('active','inactive') DEFAULT 'active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryID) REFERENCES categories(categoryID) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS inventory (
      inventoryID INT AUTO_INCREMENT PRIMARY KEY,
      productID INT NOT NULL UNIQUE,
      stockQuantity INT DEFAULT 0,
      lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (productID) REFERENCES products(productID) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS carts (
      cartID INT AUTO_INCREMENT PRIMARY KEY,
      customerID INT NOT NULL UNIQUE,
      status ENUM('active','checked_out') DEFAULT 'active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customerID) REFERENCES users(userID) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS cart_items (
      cartItemID INT AUTO_INCREMENT PRIMARY KEY,
      cartID INT NOT NULL,
      productID INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cartID) REFERENCES carts(cartID) ON DELETE CASCADE,
      FOREIGN KEY (productID) REFERENCES products(productID) ON DELETE CASCADE,
      UNIQUE KEY unique_cart_product (cartID, productID)
    )`,

    `CREATE TABLE IF NOT EXISTS orders (
      orderID INT AUTO_INCREMENT PRIMARY KEY,
      customerID INT NOT NULL,
      orderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('created','pending_payment','paid','packaged','shipped','delivered','cancelled') DEFAULT 'created',
      totalAmount DECIMAL(10,2) NOT NULL,
      shippingAddress TEXT NOT NULL,
      shippingPhone VARCHAR(20),
      assignedStaffID INT,
      notes TEXT,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customerID) REFERENCES users(userID),
      FOREIGN KEY (assignedStaffID) REFERENCES users(userID) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS order_items (
      orderItemID INT AUTO_INCREMENT PRIMARY KEY,
      orderID INT NOT NULL,
      productID INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (orderID) REFERENCES orders(orderID) ON DELETE CASCADE,
      FOREIGN KEY (productID) REFERENCES products(productID)
    )`,

    `CREATE TABLE IF NOT EXISTS payments (
      paymentID INT AUTO_INCREMENT PRIMARY KEY,
      orderID INT NOT NULL UNIQUE,
      amount DECIMAL(10,2) NOT NULL,
      paymentMethod ENUM('credit_card','bank_transfer','e_wallet','cod') NOT NULL,
      paymentStatus ENUM('pending','successful','failed') DEFAULT 'pending',
      transactionRef VARCHAR(100),
      paidAt TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderID) REFERENCES orders(orderID) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS invoices (
      invoiceID INT AUTO_INCREMENT PRIMARY KEY,
      orderID INT NOT NULL UNIQUE,
      issueDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      totalAmount DECIMAL(10,2) NOT NULL,
      taxAmount DECIMAL(10,2) DEFAULT 0,
      FOREIGN KEY (orderID) REFERENCES orders(orderID) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS shipments (
      shipmentID INT AUTO_INCREMENT PRIMARY KEY,
      orderID INT NOT NULL UNIQUE,
      shipmentDate TIMESTAMP NULL,
      deliveryStatus ENUM('pending','in_transit','delivered','failed','returned') DEFAULT 'pending',
      shippingAddress TEXT NOT NULL,
      deliveryStaffID INT,
      attemptCount INT DEFAULT 0,
      deliveredAt TIMESTAMP NULL,
      notes TEXT,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (orderID) REFERENCES orders(orderID) ON DELETE CASCADE,
      FOREIGN KEY (deliveryStaffID) REFERENCES users(userID) ON DELETE SET NULL
    )`
  ];

  for (const query of queries) {
    await pool.execute(query);
  }
  console.log('✅ All tables created successfully');
};

module.exports = { createTables };
