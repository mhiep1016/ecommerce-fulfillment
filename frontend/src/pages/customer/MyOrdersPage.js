import React, { useState, useEffect } from 'react';
import api, { formatCurrency, formatDate, statusLabel } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { addToast } = useToast();

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try { const res = await api.get('/orders/my'); setOrders(res.data.orders); }
    catch { addToast('Failed to load orders', 'error'); }
    finally { setLoading(false); }
  };

  const simulatePayment = async (orderID, action) => {
    try {
      await api.post(`/orders/${orderID}/payment`, { action });
      addToast(action === 'success' ? '✅ Payment successful!' : '❌ Payment failed', action === 'success' ? 'success' : 'error');
      loadOrders(); setSelected(null);
    } catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const cancelOrder = async (orderID) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try { await api.delete(`/orders/${orderID}/cancel`); addToast('Order cancelled', 'info'); loadOrders(); }
    catch (err) { addToast(err.response?.data?.message || 'Cannot cancel', 'error'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>📦 My Orders</h1><p>Track your order status</p></div>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="icon">📦</div><p>No orders yet</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div key={order.orderID} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Order #{order.orderID}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(order.orderDate)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge badge-${order.status}`}>{statusLabel[order.status]}</span>
                  {order.status === 'created' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => setSelected(order)}>💳 Pay Now</button>
                      <button className="btn btn-danger btn-sm" onClick={() => cancelOrder(order.orderID)}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {order.items?.map(item => (
                  <div key={item.orderItemID} style={{ display: 'flex', gap: 8, background: 'var(--bg-card2)', padding: '6px 10px', borderRadius: 8, fontSize: 13 }}>
                    <img src={item.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} onError={e => e.target.style.display = 'none'} />
                    <span>{item.productName} ×{item.quantity}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <div style={{ color: 'var(--text-muted)' }}>📍 {order.shippingAddress}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, color: 'var(--accent)' }}>{formatCurrency(order.totalAmount)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💳 Pay Order #{selected.orderID}</div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Total Amount</div>
              <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(selected.totalAmount)}</div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>⚠️ Demo environment. Select payment result:</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} onClick={() => simulatePayment(selected.orderID, 'success')}>✅ Payment Success</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => simulatePayment(selected.orderID, 'fail')}>❌ Payment Failed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
