import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { formatCurrency, formatDate, statusLabel } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const COLORS = ['#6c63ff','#43e97b','#f7971e','#ff6b6b','#38b2ff','#a78bfa','#ffd93d'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(res => setData(res.data))
      .catch(() => addToast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data) return null;

  const revenueData = data.revenueByDay.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
    'Revenue (M)': +(Number(d.revenue) / 1e6).toFixed(2),
  }));

  const statusData = data.statusBreakdown.map(s => ({
    name: statusLabel[s.status] || s.status,
    value: Number(s.count),
  }));

  return (
    <div className="page">
      <div className="page-header"><h1>📈 Dashboard</h1><p>System overview</p></div>
      <div className="stats-grid">
        <div className="stat-card purple"><div className="stat-icon">💰</div><div className="stat-label">Total Revenue</div><div className="stat-value" style={{ fontSize: 20 }}>{formatCurrency(data.stats.totalRevenue)}</div></div>
        <div className="stat-card green"><div className="stat-icon">📋</div><div className="stat-label">Total Orders</div><div className="stat-value">{data.stats.totalOrders}</div></div>
        <div className="stat-card blue"><div className="stat-icon">👥</div><div className="stat-label">Customers</div><div className="stat-value">{data.stats.totalCustomers}</div></div>
        <div className="stat-card orange"><div className="stat-icon">⏳</div><div className="stat-label">Pending Orders</div><div className="stat-value">{data.stats.pendingOrders}</div></div>
        <div className="stat-card red"><div className="stat-icon">⚠️</div><div className="stat-label">Low Stock Items</div><div className="stat-value">{data.stats.lowStockItems}</div></div>
      </div>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Revenue — Last 30 Days (Million VND)</div>
          {revenueData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No payment data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                <Line type="monotone" dataKey="Revenue (M)" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <div className="card-title">Order Status Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={true}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Recent Orders</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              {data.recentOrders.map(o => (
                <tr key={o.orderID}>
                  <td style={{ fontFamily: 'Syne', fontWeight: 700 }}>#{o.orderID}</td>
                  <td>{o.customerName}</td>
                  <td><span className={`badge badge-${o.status}`}>{statusLabel[o.status]}</span></td>
                  <td style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(o.totalAmount)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(o.orderDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
