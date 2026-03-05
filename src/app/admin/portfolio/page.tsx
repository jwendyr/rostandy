'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/admin/Toast';

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  category: string;
  tech_stack: string;
  url: string;
  github_url: string;
  image_url: string;
  status: string;
  plan_id: number | null;
  sort_order: number;
}

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500/10 text-blue-400',
  'in-progress': 'bg-amber-500/10 text-amber-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
};

export default function PortfolioAdmin() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'project', tech_stack: '', url: '', github_url: '', status: 'in-progress', sort_order: 0 });

  const load = useCallback(async () => {
    const res = await fetch('/api/portfolio');
    setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (editing) {
      await fetch('/api/portfolio', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
      setToast('Portfolio item updated');
    } else {
      await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setToast('Portfolio item added');
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function deleteItem(id: number) {
    if (!confirm('Delete this item?')) return;
    await fetch('/api/portfolio', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setToast('Item deleted');
    load();
  }

  function startEdit(item: PortfolioItem) {
    setEditing(item);
    setForm({ title: item.title, description: item.description, category: item.category, tech_stack: item.tech_stack, url: item.url, github_url: item.github_url, status: item.status, sort_order: item.sort_order });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Portfolio</h1>
          <p className="text-text-muted text-sm mt-1">Track projects and their completion status</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', description: '', category: 'project', tech_stack: '', url: '', github_url: '', status: 'in-progress', sort_order: 0 }); }} className="btn-primary">
          + Add Item
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">{editing ? 'Edit Item' : 'New Item'}</h2>
          <input className="input-field" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="textarea-field" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Tech Stack (comma separated)" value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} />
            <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="web-app">Web App</option>
              <option value="ml">Machine Learning</option>
              <option value="content">Content</option>
              <option value="devops">DevOps</option>
              <option value="business">Business</option>
              <option value="project">Project</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Live URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            <input className="input-field" placeholder="GitHub URL" value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} />
          </div>
          <div className="flex gap-4">
            <select className="input-field w-auto" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <input className="input-field w-24" type="number" placeholder="Order" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-text-primary">{item.title}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[item.status] || 'text-text-dim'}`}>{item.status}</span>
            </div>
            <p className="text-text-muted text-sm mb-3">{item.description}</p>
            {item.tech_stack && <p className="text-xs text-accent mb-2">{item.tech_stack}</p>}
            {item.plan_id && <p className="text-[10px] text-text-dim mb-2">Linked to Plan #{item.plan_id}</p>}
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <button onClick={() => startEdit(item)} className="text-xs text-accent hover:underline">Edit</button>
              <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:underline">Delete</button>
              {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:underline ml-auto">Visit</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
