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

interface EvalResult {
  agentId: number;
  evaluation: string;
  model: string;
}

export default function AgentsAdmin() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', model: 'gemini-2.5-flash', temperature: 0.7 });
  const [evaluating, setEvaluating] = useState<number | null>(null);
  const [evalResults, setEvalResults] = useState<Record<number, EvalResult>>({});
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/agents');
    setAgents(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToastType(type);
    setToast(msg);
  }

  async function save() {
    if (editing) {
      await fetch('/api/agents', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
      showToast('Agent updated');
    } else {
      await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      showToast('Agent created');
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function toggleActive(agent: Agent) {
    await fetch('/api/agents', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: agent.id, is_active: agent.is_active ? 0 : 1 }) });
    showToast(agent.is_active ? 'Agent deactivated' : 'Agent activated');
    load();
  }

  async function deleteAgent(id: number) {
    if (!confirm('Delete this agent?')) return;
    await fetch('/api/agents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    showToast('Agent deleted');
    load();
  }

  async function evaluateAgent(agent: Agent) {
    setEvaluating(agent.id);
    // Clear previous result for this agent
    setEvalResults(prev => { const n = { ...prev }; delete n[agent.id]; return n; });

    try {
      const res = await fetch('/api/agents/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id }),
      });
      const data = await res.json();

      if (data.error) {
        showToast(data.error, 'error');
      } else {
        setEvalResults(prev => ({
          ...prev,
          [agent.id]: { agentId: agent.id, evaluation: data.evaluation, model: data.model },
        }));
        showToast(`Evaluation complete for ${agent.name}`);
      }
    } catch {
      showToast('Evaluation failed', 'error');
    }

    setEvaluating(null);
  }

  function startEdit(a: Agent) {
    setEditing(a);
    setForm({ name: a.name, description: a.description, system_prompt: a.system_prompt, model: a.model, temperature: a.temperature });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} type={toastType} onClose={() => setToast('')} />}
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
          <textarea className="textarea-field min-h-[200px]" placeholder="System Prompt" value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })} />
          <div className="flex gap-4">
            <select className="input-field w-auto" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="claude-opus-4-6">Claude Opus 4.6</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-dim">Temp:</label>
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
        {agents.map((agent) => {
          const evalResult = evalResults[agent.id];
          const isEvaluating = evaluating === agent.id;
          const isPromptExpanded = expandedPrompt === agent.id;

          return (
            <div key={agent.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${agent.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-text-dim font-mono">{agent.model}</span>
                    <span className="text-[10px] text-text-dim">{agent.system_prompt.length.toLocaleString()} chars</span>
                  </div>
                  {agent.description && <p className="text-text-muted text-sm mt-1">{agent.description}</p>}
                </div>
              </div>

              {/* System Prompt Preview */}
              <div className="bg-bg rounded-lg p-3 mt-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-text-dim">System Prompt:</p>
                  {agent.system_prompt.length > 300 && (
                    <button
                      onClick={() => setExpandedPrompt(isPromptExpanded ? null : agent.id)}
                      className="text-[10px] text-accent hover:underline"
                    >
                      {isPromptExpanded ? 'Collapse' : 'Expand'}
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-muted whitespace-pre-wrap">
                  {isPromptExpanded ? agent.system_prompt : (agent.system_prompt.length > 300 ? agent.system_prompt.slice(0, 300) + '...' : agent.system_prompt)}
                </p>
              </div>

              {/* Evaluation Result */}
              {evalResult && (
                <div className="mt-3 bg-accent/5 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-accent">Evaluation Result</span>
                      <span className="text-[10px] text-text-dim font-mono">{evalResult.model}</span>
                    </div>
                    <button
                      onClick={() => setEvalResults(prev => { const n = { ...prev }; delete n[agent.id]; return n; })}
                      className="text-text-dim hover:text-text-muted text-sm"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {evalResult.evaluation}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/50 items-center">
                <button onClick={() => startEdit(agent)} className="text-xs text-accent hover:underline">Edit</button>
                <button onClick={() => toggleActive(agent)} className="text-xs text-amber-400 hover:underline">{agent.is_active ? 'Deactivate' : 'Activate'}</button>
                <button
                  onClick={() => evaluateAgent(agent)}
                  disabled={isEvaluating}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    isEvaluating
                      ? 'border-accent/20 text-accent/50 cursor-wait'
                      : 'border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50'
                  }`}
                >
                  {isEvaluating ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      Evaluating...
                    </span>
                  ) : (
                    'Evaluate Prompt'
                  )}
                </button>
                <button onClick={() => deleteAgent(agent.id)} className="text-xs text-red-400 hover:underline ml-auto">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
