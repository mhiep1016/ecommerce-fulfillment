import React, { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const emptyForm = { productName: '', description: '', price: '', stockQuantity: '', categoryID: '', imageUrl: '', status: 'active' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([api.get('/products?limit=100'), api.get('/categories')]);
      setProducts(pRes.data.products); setCategories(cRes.data.categories);
    } catch { addToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (p) => { setForm({ productName: p.productName, description: p.description || '', price: p.price, stockQuantity: p.stockQuantity, categoryID: p.categoryID || '', imageUrl: p.imageUrl || '', status: p.status }); setModal(p); };

  const save = async () => {
    try {
      if (modal === 'create') { await api.post('/products', form); addToast('Product created!', 'success'); }
      else { await api.put(`/products/${modal.productID}`, form); addToast('Product updated!', 'success'); }
      setModal(null); loadData();
    } catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try { await api.delete(`/products/${id}`); addToast('Product deactivated', 'info'); loadData(); }
    catch { addToast('Error', 'error'); }
  };

  const filtered = products.filter(p => p.productName.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>🛍️ Product Management</h1><p>{products.length} products</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>
      <div className="filter-bar">
        <input className="form-control search-input" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Image</th><th>Product Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.productID}>
                  <td><img src={p.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} onError={e => e.target.style.display = 'none'} /></td>
                  <td style={{ fontWeight: 500 }}>{p.productName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.categoryName}</td>
                  <td style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(p.price)}</td>
                  <td style={{ fontFamily: 'Syne', fontWeight: 700 }}>{p.inventoryQty ?? p.stockQuantity}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.productID)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === 'create' ? '+ Add Product' : '✏️ Edit Product'}</div>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            {[{ key: 'productName', label: 'Product Name', type: 'text' }, { key: 'price', label: 'Price (VND)', type: 'number' }, { key: 'stockQuantity', label: 'Stock Quantity', type: 'number' }, { key: 'imageUrl', label: 'Image URL', type: 'text' }].map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <input className="form-control" type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.categoryID} onChange={e => setForm(p => ({ ...p, categoryID: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.categoryID} value={c.categoryID}>{c.categoryName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            {modal !== 'create' && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{modal === 'create' ? '+ Create' : '💾 Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
