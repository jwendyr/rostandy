'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/admin/Toast';

interface Wallet {
  id: number;
  address: string;
  label: string;
  role: string;
  created_at: string;
}

export default function WalletsAdmin() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [form, setForm] = useState({ address: '', label: '', role: 'admin' });

  const load = useCallback(async () => {
    const res = await fetch('/api/wallets');
    setWallets(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg);
    setToastType(type);
  }

  async function save() {
    if (!form.address.trim()) {
      showToast('Wallet address is required', 'error');
      return;
    }

    const url = '/api/wallets';
    const method = editId ? 'PUT' : 'POST';
    const body = editId
      ? { id: editId, label: form.label, role: form.role }
      : { address: form.address.trim(), label: form.label, role: form.role };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.error) {
      showToast(data.error, 'error');
      return;
    }

    showToast(editId ? 'Wallet updated' : 'Wallet added');
    resetForm();
    load();
  }

  async function remove(id: number) {
    if (!confirm('Remove this wallet from admin access?')) return;
    const res = await fetch('/api/wallets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error, 'error');
      return;
    }
    showToast('Wallet removed');
    load();
  }

  function startEdit(w: Wallet) {
    setEditId(w.id);
    setForm({ address: w.address, label: w.label, role: w.role });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setForm({ address: '', label: '', role: 'admin' });
  }

  function truncateAddress(addr: string) {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} type={toastType} onClose={() => setToast('')} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Wallets</h1>
          <p className="text-text-muted text-sm mt-1">Manage Solana wallets that can access the admin panel</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">+ Add Wallet</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-text-dim mb-1 block">Wallet Address</label>
              <input
                className="input-field font-mono text-sm"
                placeholder="e.g. 3JswLZRXpATqzPtZedEyKw3wPd2ncH2UetpWptPCy8du"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                disabled={!!editId}
              />
            </div>
            <div>
              <label className="text-xs text-text-dim mb-1 block">Label</label>
              <input
                className="input-field"
                placeholder="e.g. Wendy's Phantom"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-text-dim mb-1 block">Role</label>
              <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">{editId ? 'Update' : 'Add Wallet'}</button>
            <button onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="glass-card p-8 text-center text-text-dim">No admin wallets configured.</div>
      ) : (
        <div className="space-y-2">
          {wallets.map(w => (
            <div key={w.id} className="glass-card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-text-primary hidden sm:inline">{w.address}</span>
                  <span className="font-mono text-sm text-text-primary sm:hidden">{truncateAddress(w.address)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    w.role === 'admin' ? 'bg-accent/10 text-accent' : w.role === 'editor' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                  }`}>{w.role}</span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-text-dim">
                  {w.label && <span>{w.label}</span>}
                  <span>Added {new Date(w.created_at + 'Z').toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(w)} className="text-xs text-accent hover:underline">Edit</button>
                <button onClick={() => remove(w.id)} className="text-xs text-red-400 hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
