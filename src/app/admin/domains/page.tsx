'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/admin/Toast';

interface Domain {
  id: number;
  domain: string;
  registrar: string;
  expiry_date: string;
  nameservers: string;
  dns_provider: string;
  cloudflare_zone_id: string;
  ssl_status: string;
  mail_provider: string;
  status: string;
  notes: string;
}

export default function DomainsAdmin() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Domain | null>(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ domain: '', registrar: '', expiry_date: '', nameservers: '', dns_provider: 'cloudflare', cloudflare_zone_id: '', ssl_status: 'unknown', mail_provider: 'none', notes: '' });

  const load = useCallback(async () => {
    const res = await fetch('/api/domains');
    setDomains(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (editing) {
      await fetch('/api/domains', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
      setToast('Domain updated');
    } else {
      await fetch('/api/domains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setToast('Domain added');
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function deleteDomain(id: number) {
    if (!confirm('Delete this domain?')) return;
    await fetch('/api/domains', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setToast('Domain deleted');
    load();
  }

  function daysUntilExpiry(date: string): number | null {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function startEdit(d: Domain) {
    setEditing(d);
    setForm({ domain: d.domain, registrar: d.registrar, expiry_date: d.expiry_date, nameservers: d.nameservers, dns_provider: d.dns_provider, cloudflare_zone_id: d.cloudflare_zone_id, ssl_status: d.ssl_status, mail_provider: d.mail_provider, notes: d.notes });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Domains</h1>
          <p className="text-text-muted text-sm mt-1">Domains pointing to this website</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ domain: '', registrar: '', expiry_date: '', nameservers: '', dns_provider: 'cloudflare', cloudflare_zone_id: '', ssl_status: 'unknown', mail_provider: 'none', notes: '' }); }} className="btn-primary">+ Add Domain</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Domain (e.g. rostandy.com)" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
            <input className="input-field" placeholder="Registrar" value={form.registrar} onChange={e => setForm({ ...form, registrar: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input className="input-field" type="date" placeholder="Expiry Date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
            <select className="input-field" value={form.dns_provider} onChange={e => setForm({ ...form, dns_provider: e.target.value })}>
              <option value="cloudflare">Cloudflare</option>
              <option value="registrar">Registrar DNS</option>
              <option value="other">Other</option>
            </select>
            <select className="input-field" value={form.ssl_status} onChange={e => setForm({ ...form, ssl_status: e.target.value })}>
              <option value="unknown">Unknown</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Nameservers" value={form.nameservers} onChange={e => setForm({ ...form, nameservers: e.target.value })} />
            <input className="input-field" placeholder="Cloudflare Zone ID" value={form.cloudflare_zone_id} onChange={e => setForm({ ...form, cloudflare_zone_id: e.target.value })} />
          </div>
          <select className="input-field w-auto" value={form.mail_provider} onChange={e => setForm({ ...form, mail_provider: e.target.value })}>
            <option value="none">No Mail</option>
            <option value="cloudflare">Cloudflare Email Routing</option>
            <option value="google">Google Workspace</option>
            <option value="other">Other</option>
          </select>
          <textarea className="textarea-field" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {domains.map((d) => {
          const days = daysUntilExpiry(d.expiry_date);
          return (
            <div key={d.id} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-text-primary">{d.domain}</h3>
                    <span className={`text-[10px] ${d.ssl_status === 'active' ? 'text-emerald-400' : 'text-text-dim'}`}>SSL: {d.ssl_status}</span>
                    {days !== null && (
                      <span className={`text-[10px] ${days < 30 ? 'text-red-400' : days < 90 ? 'text-amber-400' : 'text-text-dim'}`}>
                        {days > 0 ? `${days}d until expiry` : 'Expired'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-text-dim mt-1">
                    {d.registrar && <span>Registrar: {d.registrar}</span>}
                    <span>DNS: {d.dns_provider}</span>
                    {d.mail_provider !== 'none' && <span>Mail: {d.mail_provider}</span>}
                  </div>
                  {d.nameservers && <p className="text-xs text-text-dim mt-1 font-mono">{d.nameservers}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(d)} className="text-xs text-accent hover:underline">Edit</button>
                  <button onClick={() => deleteDomain(d.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
