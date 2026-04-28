import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

const roleLabel = { customer: 'Customer', warehouse: 'Warehouse Staff', delivery: 'Delivery Staff', admin: 'Administrator' };

export default function ProfilePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', address: user?.address || '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      addToast('Profile updated successfully!', 'success');
    } catch { addToast('Update failed', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>👤 My Profile</h1></div>
      <div style={{ maxWidth: 480 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' }}>
              {user?.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>{user?.fullName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user?.email}</div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(108,99,255,0.2)', color: 'var(--accent)', fontWeight: 600 }}>{roleLabel[user?.role]}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Edit Information</div>
          {[
            { key: 'fullName', label: 'Full Name', type: 'text' },
            { key: 'phone', label: 'Phone Number', type: 'tel' },
            { key: 'address', label: 'Address', type: 'text' },
          ].map(f => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <input className="form-control" type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
