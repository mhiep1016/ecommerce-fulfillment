import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatCurrency } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ shippingAddress: '', shippingPhone: '', paymentMethod: 'bank_transfer', notes: '' });
  const [placing, setPlacing] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.cart);
    } catch { addToast('Failed to load cart', 'error'); }
    finally { setLoading(false); }
  };

  const updateQty = async (itemID, qty) => { await api.put(`/cart/items/${itemID}`, { quantity: qty }); loadCart(); };
  const removeItem = async (itemID) => { await api.delete(`/cart/items/${itemID}`); addToast('Item removed', 'info'); loadCart(); };

  const placeOrder = async () => {
    if (!checkoutForm.shippingAddress || !checkoutForm.shippingPhone)
      return addToast('Please enter shipping address and phone number', 'error');
    setPlacing(true);
    try {
      await api.post('/orders', checkoutForm);
      addToast('Order placed successfully! 🎉', 'success');
      navigate('/my-orders');
    } catch (err) { addToast(err.response?.data?.message || 'Order failed', 'error'); }
    finally { setPlacing(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  const items = cart?.items || [];

  return (
    <div className="page">
      <div className="page-header"><h1>🛒 Cart</h1><p>{items.length} items</p></div>
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🛒</div><p>Your cart is empty</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/shop')}>Start Shopping</button>
        </div>
      ) : (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            {items.map(item => (
              <div key={item.cartItemID} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <img src={item.imageUrl || 'https://via.placeholder.com/80'} alt=""
                  style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }}
                  onError={e => e.target.src = 'https://via.placeholder.com/80'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productName}</div>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>{formatCurrency(item.price)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => updateQty(item.cartItemID, item.quantity - 1)}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => updateQty(item.cartItemID, item.quantity + 1)}>+</button>
                    <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.cartItemID)}>🗑</button>
                  </div>
                </div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Order Summary</div>
            {items.map(item => (
              <div key={item.cartItemID} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.productName} × {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(cart?.total || 0)}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => setShowCheckout(true)}>
              Place Order →
            </button>
          </div>
        </div>
      )}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📋 Confirm Order</div>
              <button className="modal-close" onClick={() => setShowCheckout(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Shipping Address *</label>
              <input className="form-control" value={checkoutForm.shippingAddress}
                onChange={e => setCheckoutForm(p => ({ ...p, shippingAddress: e.target.value }))}
                placeholder="Street, district, city..." />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className="form-control" value={checkoutForm.shippingPhone}
                onChange={e => setCheckoutForm(p => ({ ...p, shippingPhone: e.target.value }))}
                placeholder="0912..." />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-control" value={checkoutForm.paymentMethod}
                onChange={e => setCheckoutForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="e_wallet">E-Wallet</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-control" value={checkoutForm.notes}
                onChange={e => setCheckoutForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Special requests..." />
            </div>
            <div style={{ background: 'var(--bg-card2)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Payment:</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(cart?.total || 0)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCheckout(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={placeOrder} disabled={placing}>
                {placing ? '⏳ Placing order...' : '✅ Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
