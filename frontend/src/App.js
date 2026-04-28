import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/common/Sidebar';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

// Customer pages
import ShopPage from './pages/customer/ShopPage';
import CartPage from './pages/customer/CartPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';

// Warehouse pages
import WarehousePage from './pages/warehouse/WarehousePage';
import InventoryPage from './pages/warehouse/InventoryPage';

// Delivery pages
import DeliveryPage from './pages/delivery/DeliveryPage';

// Admin pages (merged admin + manager)
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminRevenuePage from './pages/admin/AdminRevenuePage';

import './styles/global.css';

// Route guard
function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Default redirect by role
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map = { admin: '/admin/dashboard', customer: '/shop', warehouse: '/warehouse', delivery: '/delivery' };
  return <Navigate to={map[user.role] || '/login'} replace />;
}

// Authenticated layout with sidebar
function Layout({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Root redirect */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Customer */}
            <Route path="/shop" element={<PrivateRoute roles={['customer']}><Layout><ShopPage /></Layout></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute roles={['customer']}><Layout><CartPage /></Layout></PrivateRoute>} />
            <Route path="/my-orders" element={<PrivateRoute roles={['customer']}><Layout><MyOrdersPage /></Layout></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute roles={['customer']}><Layout><ProfilePage /></Layout></PrivateRoute>} />

            {/* Warehouse */}
            <Route path="/warehouse" element={<PrivateRoute roles={['warehouse','admin']}><Layout><WarehousePage /></Layout></PrivateRoute>} />
            <Route path="/warehouse/inventory" element={<PrivateRoute roles={['warehouse','admin']}><Layout><InventoryPage /></Layout></PrivateRoute>} />

            {/* Delivery */}
            <Route path="/delivery" element={<PrivateRoute roles={['delivery','admin']}><Layout><DeliveryPage /></Layout></PrivateRoute>} />

            {/* Admin (merged admin + manager) */}
            <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><Layout><AdminDashboard /></Layout></PrivateRoute>} />
            <Route path="/admin/orders" element={<PrivateRoute roles={['admin']}><Layout><AdminOrdersPage /></Layout></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute roles={['admin']}><Layout><AdminProductsPage /></Layout></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><Layout><AdminUsersPage /></Layout></PrivateRoute>} />
            <Route path="/admin/inventory" element={<PrivateRoute roles={['admin']}><Layout><AdminInventoryPage /></Layout></PrivateRoute>} />
            <Route path="/admin/revenue" element={<PrivateRoute roles={['admin']}><Layout><AdminRevenuePage /></Layout></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
