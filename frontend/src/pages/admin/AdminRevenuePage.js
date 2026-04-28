import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api, { formatCurrency, statusLabel } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AdminRevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(res => setData(res.data))
      .catch(() => addToast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data) return null;

  const revenueData = data.revenueByDay.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
    'Million VND': +(Number(d.revenue) / 1e6).toFixed(2),
  }));

  const statusData = data.statusBreakdown.map(s => ({
    name: statusLabel[s.status] || s.status,
    'Orders': Number(s.count),
  }));

  return (
    <div className="page">
      <div className="page-header"><h1>💰 Revenue Report</h1><p>Sales and order statistics</p></div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card purple"><div className="stat-icon">💰</div><div className="stat-label">Total Revenue</div><div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(data.stats.totalRevenue)}</div></div>
        <div className="stat-card green"><div className="stat-icon">📋</div><div className="stat-label">Total Orders</div><div className="stat-value">{data.stats.totalOrders}</div></div>
        <div className="stat-card blue"><div className="stat-icon">💳</div><div className="stat-label">Avg. Order Value</div><div className="stat-value" style={{ fontSize: 18 }}>{data.stats.totalOrders > 0 ? formatCurrency(data.stats.totalRevenue / data.stats.totalOrders) : '—'}</div></div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Daily Revenue — Last 30 Days (Million VND)</div>
        {revenueData.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No payment data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
              <Bar dataKey="Million VND" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <div className="card-title">Orders by Status</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={statusData} layout="vertical">
            <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} width={120} />
            <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
            <Bar dataKey="Orders" fill="var(--accent2)" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
