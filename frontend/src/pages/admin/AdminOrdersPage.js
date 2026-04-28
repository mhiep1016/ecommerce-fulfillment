import React, { useState, useEffect } from 'react';
import api, { formatCurrency, formatDate, statusLabel } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const ALL_STATUSES = ['created','pending_payment','paid','packaged','shipped','delivered','cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const { addToast } = useToast();

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/orders${params}`);
      setOrders(res.data.orders);
    } catch { addToast('Failed to load orders', 'error'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderID, status) => {
    try { await api.put(`/orders/${orderID}/status`, { status }); addToast('Status updated!', 'success'); loadOrders(); setSelected(null); }
    catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const cancelOrder = async (orderID) => {
    if (!window.confirm('Cancel this order?')) return;
    try { await api.delete(`/orders/${orderID}/cancel`); addToast('Order cancelled', 'info'); loadOrders(); setSelected(null); }
    catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>📋 Order Management</h1><p>View and update all orders</p></div>
      <div className="filter-bar">
        <button className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter('')}>All</button>
        {ALL_STATUSES.map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>{statusLabel[s]}</button>
        ))}
      </div>
      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order ID</th><th>Customer</th><th>Status</th><th>Payment</th><th>Delivery</th><th>Amount</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderID}>
                    <td style={{ fontFamily: 'Syne', fontWeight: 700 }}>#{o.orderID}</td>
                    <td>{o.customerName}</td>
                    <td><span className={`badge badge-${o.status}`}>{statusLabel[o.status]}</span></td>
                    <td><span className={`badge badge-${o.paymentStatus || 'pending'}`}>{o.paymentStatus || '—'}</span></td>
                    <td><span className={`badge badge-${o.deliveryStatus || 'pending'}`}>{o.deliveryStatus || '—'}</span></td>
                    <td style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(o.totalAmount)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(o.orderDate)}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(o)}>Details</button></td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Order #{selected.orderID}</div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 13 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Customer:</span> {selected.customerName}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Date:</span> {formatDate(selected.orderDate)}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Address:</span> {selected.shippingAddress}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Total:</span> <strong style={{ color: 'var(--accent)' }}>{formatCurrency(selected.totalAmount)}</strong></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Update Status</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ALL_STATUSES.filter(s => s !== 'cancelled').map(s => (
                  <button key={s} className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => updateStatus(selected.orderID, s)} disabled={selected.status === s}>
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>
            {!['delivered','cancelled'].includes(selected.status) && (
              <button className="btn btn-danger btn-sm" onClick={() => cancelOrder(selected.orderID)}>🗑 Cancel Order</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
