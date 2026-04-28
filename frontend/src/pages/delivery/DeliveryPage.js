import React, { useState, useEffect } from 'react';
import api, { formatCurrency, formatDate, statusLabel } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function DeliveryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issueModal, setIssueModal] = useState(null);
  const [issueNote, setIssueNote] = useState('');
  const { addToast } = useToast();

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try { const res = await api.get('/delivery/orders'); setOrders(res.data.orders); }
    catch { addToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderID, status) => {
    try { await api.put(`/orders/${orderID}/status`, { status }); addToast('Updated successfully!', 'success'); loadOrders(); }
    catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const reportIssue = async () => {
    try {
      const res = await api.post(`/delivery/shipments/${issueModal.shipmentID}/issue`, { notes: issueNote });
      addToast(res.data.message, 'info');
      setIssueModal(null); setIssueNote(''); loadOrders();
    } catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>🚚 Deliveries</h1><p>{orders.length} orders to deliver</p></div>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="icon">✅</div><p>No orders to deliver</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => (
            <div key={order.orderID} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Order #{order.orderID}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>👤 {order.customerName} • 📞 {order.customerPhone}</div>
                  <div style={{ color: 'var(--text)', fontSize: 14, marginTop: 4, fontWeight: 500 }}>📍 {order.shippingAddress}</div>
                  {order.attemptCount > 0 && <div style={{ color: 'var(--warning)', fontSize: 12, marginTop: 4 }}>⚠️ {order.attemptCount} failed attempt(s)</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${order.status}`}>{statusLabel[order.status]}</span>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 17, color: 'var(--accent)', marginTop: 6 }}>{formatCurrency(order.totalAmount)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {order.status === 'packaged' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(order.orderID, 'shipped')}>🚚 Start Delivery</button>}
                {order.status === 'shipped' && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => updateStatus(order.orderID, 'delivered')}>✅ Delivered</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setIssueModal(order)}>❌ Delivery Failed</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {issueModal && (
        <div className="modal-overlay" onClick={() => setIssueModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚠️ Report Delivery Issue</div>
              <button className="modal-close" onClick={() => setIssueModal(null)}>×</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Order #{issueModal.orderID} • Attempts: {issueModal.attemptCount || 0}<br />
              After 3 failed attempts, the order will be automatically cancelled.
            </p>
            <div className="form-group">
              <label className="form-label">Reason for failed delivery</label>
              <input className="form-control" value={issueNote} onChange={e => setIssueNote(e.target.value)} placeholder="E.g. Customer not answering, wrong address..." />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIssueModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={reportIssue}>Report Issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
