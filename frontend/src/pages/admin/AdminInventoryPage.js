import React, { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AdminInventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    api.get('/reports/inventory')
      .then(res => setItems(res.data.items))
      .catch(() => addToast('Failed to load inventory', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => (filter === 'all' || i.stockStatus === filter) && i.productName.toLowerCase().includes(search.toLowerCase()));
  const counts = { all: items.length, ok: items.filter(i => i.stockStatus === 'ok').length, low: items.filter(i => i.stockStatus === 'low').length, out_of_stock: items.filter(i => i.stockStatus === 'out_of_stock').length };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>📦 Inventory</h1><p>Stock levels for all products</p></div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <div className="stat-card purple"><div className="stat-value">{counts.all}</div><div className="stat-label">Total Products</div></div>
        <div className="stat-card green"><div className="stat-value">{counts.ok}</div><div className="stat-label">In Stock</div></div>
        <div className="stat-card orange"><div className="stat-value">{counts.low}</div><div className="stat-label">Low Stock (&lt;10)</div></div>
        <div className="stat-card red"><div className="stat-value">{counts.out_of_stock}</div><div className="stat-label">Out of Stock</div></div>
      </div>
      <div className="filter-bar">
        <input className="form-control search-input" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        {[['all','All'],['ok','In Stock'],['low','Low Stock'],['out_of_stock','Out of Stock']].map(([v, l]) => (
          <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Product</th><th>Category</th><th>Stock</th><th>Unit Price</th><th>Stock Value</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.productID}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.productID}</td>
                  <td style={{ fontWeight: 500 }}>{item.productName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.categoryName || '—'}</td>
                  <td style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18 }}>{item.stockQuantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td style={{ color: 'var(--accent)', fontFamily: 'Syne', fontWeight: 600 }}>{formatCurrency(item.price * item.stockQuantity)}</td>
                  <td><span className={`badge badge-${item.stockStatus}`}>{item.stockStatus === 'ok' ? 'In Stock' : item.stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
