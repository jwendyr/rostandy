'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/admin/Toast';

interface Site {
  id: number;
  name: string;
  type: string;
  url: string;
  port: number;
  status: string;
  description: string;
  config: string;
}

export default function SitesAdmin() {
  const [sites, setSites] = useState<Site[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ name: '', type: 'subdomain', url: '', port: 0, description: '', config: '{}' });

  const load = useCallback(async () => {
    const res = await fetch('/api/sites');
    setSites(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    let parsedConfig;
    try { parsedConfig = JSON.parse(form.config); } catch { parsedConfig = {}; }
    if (editing) {
      await fetch('/api/sites', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form, config: parsedConfig }) });
      setToast('Site updated');
    } else {
      await fetch('/api/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, config: parsedConfig }) });
      setToast('Site added');
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function deleteSite(id: number) {
    if (!confirm('Delete this site?')) return;
    await fetch('/api/sites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setToast('Site deleted');
    load();
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sites</h1>
          <p className="text-text-muted text-sm mt-1">Subdomains, workers, schedules, and APIs for this website</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', type: 'subdomain', url: '', port: 0, description: '', config: '{}' }); }} className="btn-primary">+ Add Site</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="subdomain">Subdomain</option>
              <option value="worker">Worker</option>
              <option value="schedule">Schedule</option>
              <option value="api">API</option>
              <option value="webhook">Webhook</option>
            </select>
            <input className="input-field" placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            <input className="input-field" type="number" placeholder="Port" value={form.port || ''} onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 0 })} />
          </div>
          <textarea className="textarea-field" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <textarea className="textarea-field font-mono text-xs" placeholder="Config JSON" value={form.config} onChange={e => setForm({ ...form, config: e.target.value })} rows={3} />
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sites.map((site) => (
          <div key={site.id} className="glass-card p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-text-primary">{site.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent">{site.type}</span>
                <span className={`text-[10px] ${site.status === 'active' ? 'text-emerald-400' : 'text-text-dim'}`}>{site.status}</span>
              </div>
              {site.description && <p className="text-text-muted text-sm mt-1">{site.description}</p>}
              <div className="flex gap-4 text-xs text-text-dim mt-1">
                {site.url && <span>{site.url}</span>}
                {site.port > 0 && <span>Port: {site.port}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(site); setForm({ name: site.name, type: site.type, url: site.url, port: site.port, description: site.description, config: site.config }); setShowForm(true); }} className="text-xs text-accent hover:underline">Edit</button>
              <button onClick={() => deleteSite(site.id)} className="text-xs text-red-400 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {sites.length === 0 && <div className="glass-card p-8 text-center text-text-dim">No sites configured yet.</div>}
      </div>
    </div>
  );
}
