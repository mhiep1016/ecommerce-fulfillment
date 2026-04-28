import React, { useState, useEffect } from 'react';
import api, { formatCurrency, formatDate, statusLabel } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function WarehousePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try { const res = await api.get('/warehouse/orders'); setOrders(res.data.orders); }
    catch { addToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderID, status) => {
    try { await api.put(`/orders/${orderID}/status`, { status }); addToast('Status updated!', 'success'); loadOrders(); }
    catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  const paid = orders.filter(o => o.status === 'paid');
  const packaged = orders.filter(o => o.status === 'packaged');

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏭 Warehouse — Order Processing</h1>
        <p>{paid.length} orders to package • {packaged.length} orders ready to ship</p>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
        <div className="stat-card blue"><div className="stat-icon">💳</div><div className="stat-value">{paid.length}</div><div className="stat-label">Awaiting Packaging (Paid)</div></div>
        <div className="stat-card purple"><div className="stat-icon">📦</div><div className="stat-value">{packaged.length}</div><div className="stat-label">Packaged (Ready to Ship)</div></div>
      </div>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="icon">✅</div><p>No orders to process</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => (
            <div key={order.orderID} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Order #{order.orderID}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>👤 {order.customerName} • 📞 {order.customerPhone}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>📍 {order.shippingAddress}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>🕐 {formatDate(order.orderDate)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${order.status}`}>{statusLabel[order.status]}</span>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--accent)', marginTop: 6 }}>{formatCurrency(order.totalAmount)}</div>
                </div>
              </div>
              <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {order.items?.map(item => (
                  <div key={item.orderItemID} style={{ background: 'var(--bg-card2)', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                    {item.productName} ×{item.quantity}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {order.status === 'paid' && (
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(order.orderID, 'packaged')}>📦 Mark as Packaged</button>
                )}
                {order.status === 'packaged' && (
                  <button className="btn btn-success btn-sm" onClick={() => updateStatus(order.orderID, 'shipped')}>🚚 Hand Over to Delivery</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
