import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMO_ACCOUNTS = [
  { email: 'admin@store.com',     role: 'Admin',     color: '#ff6b6b', icon: '👑' },
  { email: 'customer@store.com',  role: 'Customer',  color: '#6c63ff', icon: '🛍️' },
  { email: 'warehouse@store.com', role: 'Warehouse', color: '#43e97b', icon: '🏭' },
  { email: 'delivery@store.com',  role: 'Delivery',  color: '#38b2ff', icon: '🚚' },
];

const roleRedirect = {
  admin: '/admin/dashboard', customer: '/shop', warehouse: '/warehouse', delivery: '/delivery',
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      addToast(`Welcome, ${user.fullName}!`, 'success');
      navigate(roleRedirect[user.role] || '/shop');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const quickLogin = (email) => setForm({ email, password: 'password123' });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>⚡ FulFillPro</h1>
          <p>E-Commerce Order Fulfillment System</p>
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick demo — password: <code style={{ color: 'var(--accent)' }}>password123</code>
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.email} className="btn btn-secondary btn-sm"
                style={{ borderColor: a.color + '55', color: a.color }}
                onClick={() => quickLogin(a.email)} type="button">
                {a.icon} {a.role}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" placeholder="email@example.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={loading}>
            {loading ? '⏳ Signing in...' : '🚀 Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
