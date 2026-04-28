const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const product = require('../controllers/productController');
const cart = require('../controllers/cartController');
const order = require('../controllers/orderController');
const admin = require('../controllers/adminController');

// ── AUTH ─────────────────────────────────────────────────
router.post('/auth/login', auth.login);
router.post('/auth/register', auth.register);
router.get('/auth/profile', authenticate, auth.getProfile);
router.put('/auth/profile', authenticate, auth.updateProfile);

// ── PRODUCTS (public) ────────────────────────────────────
router.get('/products', product.getAllProducts);
router.get('/products/:id', product.getProduct);
router.get('/categories', product.getCategories);
router.post('/products', authenticate, authorize('admin'), product.createProduct);
router.put('/products/:id', authenticate, authorize('admin'), product.updateProduct);
router.delete('/products/:id', authenticate, authorize('admin'), product.deleteProduct);

// ── CART ─────────────────────────────────────────────────
router.get('/cart', authenticate, authorize('customer'), cart.getCart);
router.post('/cart/items', authenticate, authorize('customer'), cart.addToCart);
router.put('/cart/items/:itemID', authenticate, authorize('customer'), cart.updateCartItem);
router.delete('/cart/items/:itemID', authenticate, authorize('customer'), cart.removeFromCart);

// ── ORDERS ───────────────────────────────────────────────
router.post('/orders', authenticate, authorize('customer'), order.placeOrder);
router.get('/orders/my', authenticate, authorize('customer'), order.getMyOrders);
router.post('/orders/:orderID/payment', authenticate, authorize('customer'), order.processPayment);
router.delete('/orders/:id/cancel', authenticate, order.cancelOrder);
router.get('/orders', authenticate, authorize('admin', 'warehouse', 'delivery'), order.getAllOrders);
router.get('/orders/:id', authenticate, order.getOrder);
router.put('/orders/:id/status', authenticate, authorize('admin', 'warehouse', 'delivery'), order.updateOrderStatus);

// ── WAREHOUSE ────────────────────────────────────────────
router.get('/warehouse/orders', authenticate, authorize('warehouse', 'admin'), admin.getWarehouseOrders);

// ── DELIVERY ─────────────────────────────────────────────
router.get('/delivery/orders', authenticate, authorize('delivery', 'admin'), admin.getDeliveryOrders);
router.post('/delivery/shipments/:id/issue', authenticate, authorize('delivery', 'admin'), admin.reportDeliveryIssue);

// ── REPORTS & DASHBOARD (admin only) ────────────────────
router.get('/reports/dashboard', authenticate, authorize('admin'), admin.getDashboardStats);
router.get('/reports/inventory', authenticate, authorize('admin', 'warehouse'), admin.getInventoryReport);

// ── USER MANAGEMENT (admin only) ─────────────────────────
router.get('/users', authenticate, authorize('admin'), admin.getAllUsers);
router.post('/users', authenticate, authorize('admin'), admin.createUser);
router.put('/users/:id', authenticate, authorize('admin'), admin.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), admin.deleteUser);

module.exports = router;
