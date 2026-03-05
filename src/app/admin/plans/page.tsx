'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/admin/Toast';

interface Plan {
  id: number;
  title: string;
  description: string;
  steps: string;
  status: string;
  priority: string;
  category: string;
  queue_status: string;
  queue_result: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const queueColors: Record<string, string> = {
  idle: 'text-text-dim',
  queued: 'text-amber-400',
  running: 'text-accent animate-pulse',
  done: 'text-emerald-400',
  failed: 'text-red-400',
};

export default function PlansAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ title: '', description: '', steps: '[]', priority: 'medium', category: 'feature' });

  const load = useCallback(async () => {
    const res = await fetch('/api/plans');
    setPlans(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/plans/${editing.id}` : '/api/plans';
    let parsedSteps;
    try { parsedSteps = JSON.parse(form.steps); } catch { parsedSteps = []; }
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, steps: parsedSteps }) });
    setToast(editing ? 'Plan updated' : 'Plan created');
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', description: '', steps: '[]', priority: 'medium', category: 'feature' });
    load();
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/plans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setToast(`Status updated to ${status}`);
    load();
  }

  async function queuePlan(id: number) {
    await fetch(`/api/plans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'queue' }) });
    setToast('Plan queued for background agent');
    load();
  }

  async function deletePlan(id: number) {
    if (!confirm('Delete this plan?')) return;
    await fetch(`/api/plans/${id}`, { method: 'DELETE' });
    setToast('Plan deleted');
    load();
  }

  function startEdit(plan: Plan) {
    setEditing(plan);
    setForm({ title: plan.title, description: plan.description, steps: plan.steps, priority: plan.priority, category: plan.category });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Plans</h1>
          <p className="text-text-muted text-sm mt-1">Manage project plans and queue for execution</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', description: '', steps: '[]', priority: 'medium', category: 'feature' }); }} className="btn-primary">
          + New Plan
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-text-primary">{editing ? 'Edit Plan' : 'New Plan'}</h2>
          <input className="input-field" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="textarea-field" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <textarea className="textarea-field font-mono text-xs" placeholder='Steps JSON: ["Step 1", "Step 2"]' value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} rows={4} />
          <div className="flex gap-4">
            <select className="input-field w-auto" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select className="input-field w-auto" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="feature">Feature</option>
              <option value="bugfix">Bug Fix</option>
              <option value="improvement">Improvement</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="content">Content</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {plans.map((plan) => {
          let steps: string[] = [];
          try { steps = JSON.parse(plan.steps); } catch { /* empty */ }
          return (
            <div key={plan.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-text-primary">{plan.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[plan.status] || ''}`}>{plan.status}</span>
                    <span className={`text-[10px] font-mono ${queueColors[plan.queue_status] || ''}`}>[{plan.queue_status}]</span>
                  </div>
                  {plan.description && <p className="text-text-muted text-sm">{plan.description}</p>}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-dim">{plan.priority}</span>
                  <span className="text-text-dim">|</span>
                  <span className="text-text-dim">{plan.category}</span>
                </div>
              </div>
              {steps.length > 0 && (
                <div className="mt-3 space-y-1">
                  {steps.map((step, i) => (
                    <div key={i} className="text-sm text-text-muted flex items-center gap-2">
                      <span className="text-text-dim font-mono text-xs w-5">{i + 1}.</span>
                      <span>{String(step)}</span>
                    </div>
                  ))}
                </div>
              )}
              {plan.queue_result && (
                <div className="mt-3 bg-bg rounded-lg p-3 text-xs text-text-muted font-mono whitespace-pre-wrap">{plan.queue_result}</div>
              )}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                <button onClick={() => startEdit(plan)} className="text-xs text-accent hover:underline">Edit</button>
                <button onClick={() => queuePlan(plan.id)} className="text-xs text-amber-400 hover:underline" disabled={plan.queue_status === 'queued' || plan.queue_status === 'running'}>
                  Queue
                </button>
                {plan.status !== 'in-progress' && <button onClick={() => updateStatus(plan.id, 'in-progress')} className="text-xs text-blue-400 hover:underline">Start</button>}
                {plan.status !== 'completed' && <button onClick={() => updateStatus(plan.id, 'completed')} className="text-xs text-emerald-400 hover:underline">Complete</button>}
                <button onClick={() => deletePlan(plan.id)} className="text-xs text-red-400 hover:underline ml-auto">Delete</button>
                <span className="text-[10px] text-text-dim">{new Date(plan.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
        {plans.length === 0 && <div className="glass-card p-8 text-center text-text-dim">No plans yet. Create your first plan above.</div>}
      </div>
    </div>
  );
}
