import React, { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', categoryID: '', page: 1 });
  const [pagination, setPagination] = useState({});
  const { addToast } = useToast();

  useEffect(() => { loadProducts(); }, [filters]);
  useEffect(() => { loadCategories(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.categoryID) params.append('categoryID', filters.categoryID);
      params.append('page', filters.page);
      params.append('limit', 12);
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products);
      setPagination({ total: res.data.total, pages: res.data.pages });
    } catch { addToast('Failed to load products', 'error'); }
    finally { setLoading(false); }
  };

  const loadCategories = async () => {
    const res = await api.get('/categories');
    setCategories(res.data.categories);
  };

  const addToCart = async (productID) => {
    try {
      await api.post('/cart/items', { productID, quantity: 1 });
      addToast('Added to cart! 🛒', 'success');
    } catch (err) { addToast(err.response?.data?.message || 'Failed to add to cart', 'error'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🛍️ Shop</h1>
        <p>Browse our products</p>
      </div>
      <div className="filter-bar">
        <input className="form-control search-input" placeholder="🔍 Search products..."
          value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
        <select className="form-control" style={{ width: 180 }}
          value={filters.categoryID} onChange={e => setFilters(p => ({ ...p, categoryID: e.target.value, page: 1 }))}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.categoryID} value={c.categoryID}>{c.categoryName}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="icon">🔍</div><p>No products found</p></div>
      ) : (
        <>
          <div className="products-grid">
            {products.map(p => (
              <div key={p.productID} className="product-card">
                <img className="product-img"
                  src={p.imageUrl || 'https://via.placeholder.com/400x300?text=Product'} alt={p.productName}
                  onError={e => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }} />
                <div className="product-body">
                  <div className="product-category">{p.categoryName}</div>
                  <div className="product-name">{p.productName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <div>
                      <div className="product-price">{formatCurrency(p.price)}</div>
                      <div className="product-stock">Stock: {p.inventoryQty ?? p.stockQuantity}</div>
                    </div>
                    <button className="btn btn-primary btn-sm"
                      onClick={() => addToCart(p.productID)}
                      disabled={!p.inventoryQty && !p.stockQuantity}>
                      {(p.inventoryQty ?? p.stockQuantity) > 0 ? '+ Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`btn btn-sm ${filters.page === p ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilters(prev => ({ ...prev, page: p }))}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
