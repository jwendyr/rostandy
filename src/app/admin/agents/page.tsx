'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/admin/Toast';

interface Agent {
  id: number;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  is_active: number;
}

export default function AgentsAdmin() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', model: 'gemini-2.5-flash', temperature: 0.7 });

  const load = useCallback(async () => {
    const res = await fetch('/api/agents');
    setAgents(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (editing) {
      await fetch('/api/agents', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
      setToast('Agent updated');
    } else {
      await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setToast('Agent created');
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function toggleActive(agent: Agent) {
    await fetch('/api/agents', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: agent.id, is_active: agent.is_active ? 0 : 1 }) });
    setToast(agent.is_active ? 'Agent deactivated' : 'Agent activated');
    load();
  }

  async function deleteAgent(id: number) {
    if (!confirm('Delete this agent?')) return;
    await fetch('/api/agents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setToast('Agent deleted');
    load();
  }

  function startEdit(a: Agent) {
    setEditing(a);
    setForm({ name: a.name, description: a.description, system_prompt: a.system_prompt, model: a.model, temperature: a.temperature });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Agents</h1>
          <p className="text-text-muted text-sm mt-1">Manage AI agent prompts and configurations</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '', system_prompt: '', model: 'gemini-2.5-flash', temperature: 0.7 }); }} className="btn-primary">+ New Agent</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <input className="input-field" placeholder="Agent Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <textarea className="textarea-field min-h-[200px]" placeholder="System Prompt — this is the main instruction for the AI agent" value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })} />
          <div className="flex gap-4">
            <select className="input-field w-auto" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-dim">Temperature:</label>
              <input className="input-field w-20" type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) || 0.7 })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {agents.map((agent) => (
          <div key={agent.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${agent.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[10px] text-text-dim font-mono">{agent.model}</span>
                </div>
                {agent.description && <p className="text-text-muted text-sm mt-1">{agent.description}</p>}
              </div>
            </div>
            <div className="bg-bg rounded-lg p-3 mt-3">
              <p className="text-xs text-text-dim mb-1">System Prompt:</p>
              <p className="text-sm text-text-muted whitespace-pre-wrap">{agent.system_prompt.length > 300 ? agent.system_prompt.slice(0, 300) + '...' : agent.system_prompt}</p>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
              <button onClick={() => startEdit(agent)} className="text-xs text-accent hover:underline">Edit</button>
              <button onClick={() => toggleActive(agent)} className="text-xs text-amber-400 hover:underline">{agent.is_active ? 'Deactivate' : 'Activate'}</button>
              <button onClick={() => deleteAgent(agent.id)} className="text-xs text-red-400 hover:underline ml-auto">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
