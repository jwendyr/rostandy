'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/admin/Toast';

interface Setting {
  key: string;
  value: string;
  category: string;
  is_secret: number;
  description: string;
}

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [form, setForm] = useState({ key: '', value: '', category: 'api-keys', is_secret: true, description: '' });

  const load = useCallback(async () => {
    const res = await fetch('/api/settings');
    setSettings(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setToast('Setting saved');
    setToastType('success');
    setShowForm(false);
    setForm({ key: '', value: '', category: 'api-keys', is_secret: true, description: '' });
    load();
  }

  async function deleteSetting(key: string) {
    if (!confirm(`Delete ${key}?`)) return;
    await fetch('/api/settings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
    setToast('Setting deleted');
    setToastType('success');
    load();
  }

  async function syncToEnv() {
    const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sync-to-env' }) });
    const data = await res.json();
    if (data.success) {
      setToast('Settings synced to .env file');
      setToastType('success');
    } else {
      setToast('Sync failed');
      setToastType('error');
    }
  }

  const categories = [...new Set(settings.map(s => s.category))];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} type={toastType} onClose={() => setToast('')} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-muted text-sm mt-1">API keys and configuration management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncToEnv} className="btn-secondary">Sync to .env</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Key</button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field font-mono" placeholder="KEY_NAME (e.g. GEMINI_API_KEY)" value={form.key} onChange={e => setForm({ ...form, key: e.target.value.toUpperCase() })} />
            <input className="input-field font-mono" placeholder="Value" type={form.is_secret ? 'password' : 'text'} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
          </div>
          <div className="flex gap-4 items-center">
            <select className="input-field w-auto" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="api-keys">API Keys</option>
              <option value="auth">Authentication</option>
              <option value="service">Service Config</option>
              <option value="general">General</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input type="checkbox" checked={form.is_secret} onChange={e => setForm({ ...form, is_secret: e.target.checked })} className="accent-accent" />
              Secret (masked)
            </label>
          </div>
          <input className="input-field" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">Save</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {categories.length === 0 && !showForm && (
        <div className="glass-card p-8 text-center text-text-dim">No settings configured. Add API keys and configuration above.</div>
      )}

      {categories.map(cat => (
        <div key={cat} className="space-y-2">
          <h2 className="text-sm font-bold text-text-dim uppercase tracking-wider">{cat}</h2>
          {settings.filter(s => s.category === cat).map(s => (
            <div key={s.key} className="glass-card p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-text-primary">{s.key}</span>
                  {s.is_secret ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">secret</span>
                  ) : null}
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs font-mono text-text-dim">{s.value || '(empty)'}</span>
                  {s.description && <span className="text-xs text-text-dim">— {s.description}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm({ key: s.key, value: '', category: s.category, is_secret: !!s.is_secret, description: s.description }); setShowForm(true); }} className="text-xs text-accent hover:underline">Update</button>
                <button onClick={() => deleteSetting(s.key)} className="text-xs text-red-400 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
