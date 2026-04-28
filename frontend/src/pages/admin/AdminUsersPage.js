import React, { useState, useEffect } from 'react';
import api, { formatDate } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const ROLES = ['customer','warehouse','delivery','admin'];
const roleLabel = { customer: 'Customer', warehouse: 'Warehouse', delivery: 'Delivery', admin: 'Admin' };
const emptyForm = { fullName: '', email: '', password: '', phone: '', address: '', role: 'customer', status: 'active' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { addToast } = useToast();

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try { const res = await api.get('/users'); setUsers(res.data.users); }
    catch { addToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (u) => { setForm({ fullName: u.fullName, email: u.email, password: '', phone: u.phone || '', address: u.address || '', role: u.role, status: u.status }); setModal(u); };

  const save = async () => {
    try {
      const payload = { ...form };
      if (modal !== 'create' && !payload.password) delete payload.password;
      if (modal === 'create') { await api.post('/users', payload); addToast('User created!', 'success'); }
      else { await api.put(`/users/${modal.userID}`, payload); addToast('User updated!', 'success'); }
      setModal(null); loadUsers();
    } catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this account?')) return;
    try { await api.delete(`/users/${id}`); addToast('Account deactivated', 'info'); loadUsers(); }
    catch { addToast('Error', 'error'); }
  };

  const filtered = users.filter(u =>
    (u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || u.role === roleFilter)
  );

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>👥 User Management</h1><p>{users.length} accounts</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>
      <div className="filter-bar">
        <input className="form-control search-input" placeholder="🔍 Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
        </select>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Full Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.userID}>
                  <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: u.role === 'admin' ? 'rgba(255,107,107,0.2)' : u.role === 'customer' ? 'rgba(108,99,255,0.2)' : u.role === 'warehouse' ? 'rgba(67,233,123,0.2)' : 'rgba(56,178,255,0.2)',
                      color: u.role === 'admin' ? 'var(--danger)' : u.role === 'customer' ? 'var(--accent)' : u.role === 'warehouse' ? 'var(--success)' : 'var(--info)' }}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td><span className={`badge badge-${u.status}`}>{u.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(u.createdAt)}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️</button>
                    {u.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => deactivate(u.userID)}>🚫</button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === 'create' ? '+ Create Account' : '✏️ Edit Account'}</div>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            {[{ key: 'fullName', label: 'Full Name', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'password', label: modal === 'create' ? 'Password' : 'New Password (leave blank to keep)', type: 'password' }, { key: 'phone', label: 'Phone', type: 'tel' }, { key: 'address', label: 'Address', type: 'text' }].map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <input className="form-control" type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
              </select>
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
