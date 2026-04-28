import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navConfig = {
  customer: [
    { path: '/shop', icon: '🛍️', label: 'Shop' },
    { path: '/cart', icon: '🛒', label: 'Cart' },
    { path: '/my-orders', icon: '📦', label: 'My Orders' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ],
  warehouse: [
    { path: '/warehouse', icon: '🏭', label: 'Pending Orders' },
    { path: '/warehouse/inventory', icon: '📊', label: 'Inventory' },
  ],
  delivery: [
    { path: '/delivery', icon: '🚚', label: 'Deliveries' },
  ],
  admin: [
    { path: '/admin/dashboard', icon: '📈', label: 'Dashboard' },
    { path: '/admin/orders', icon: '📋', label: 'Orders' },
    { path: '/admin/products', icon: '🛍️', label: 'Products' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/inventory', icon: '📦', label: 'Inventory' },
    { path: '/admin/revenue', icon: '💰', label: 'Revenue' },
  ],
};

const roleLabel = {
  customer: 'Customer', warehouse: 'Warehouse Staff',
  delivery: 'Delivery Staff', admin: 'Administrator',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!user) return null;
  const navItems = navConfig[user.role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>⚡ FulFillPro</h2>
        <span>Order Fulfillment System</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.path}
            className={`nav-item ${pathname.startsWith(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">{user.fullName?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.fullName}</div>
            <div className="user-role">{roleLabel[user.role]}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm"
          style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
          onClick={logout}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
