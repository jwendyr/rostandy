'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface LogEntry {
  id: number;
  command: string;
  response: string;
  model: string;
  shell_commands: string;
  shell_outputs: string;
  created_at: string;
}

interface MemoryEntry {
  key: string;
  value: string;
  updated_at: string;
}

export default function ControlPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [showMemory, setShowMemory] = useState(false);
  const [activeLog, setActiveLog] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/control');
    const data = await res.json();
    setLogs(data.logs?.reverse() || []);
    setMemory(data.memory || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, loading]);

  async function execute() {
    const cmd = input.trim();
    if (!cmd || loading) return;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      await res.json();
      await load();
    } catch {
      // reload logs anyway
      await load();
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  async function clearLogs() {
    if (!confirm('Clear all control logs?')) return;
    await fetch('/api/control', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-logs' }),
    });
    setLogs([]);
  }

  async function deleteMemory(key: string) {
    await fetch('/api/control', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-memory', key }),
    });
    load();
  }

  function parseShellData(log: LogEntry): { commands: string[]; outputs: string[] } {
    try {
      return {
        commands: JSON.parse(log.shell_commands || '[]'),
        outputs: JSON.parse(log.shell_outputs || '[]'),
      };
    } catch {
      return { commands: [], outputs: [] };
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Control</h1>
          <p className="text-text-muted text-sm mt-0.5">AI agent with shell access &middot; Claude Opus 4.6</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMemory(!showMemory)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showMemory ? 'border-accent/40 text-accent bg-accent/5' : 'border-border text-text-muted hover:text-text-primary'}`}>
            Memory ({memory.length})
          </button>
          <button onClick={clearLogs} className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-red-400 hover:border-red-400/30 transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* Memory panel */}
      {showMemory && memory.length > 0 && (
        <div className="glass-card p-4 mb-4 shrink-0 max-h-48 overflow-y-auto">
          <div className="space-y-1.5">
            {memory.map(m => (
              <div key={m.key} className="flex items-start justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-mono text-accent">{m.key}</span>
                  <span className="text-text-dim mx-1.5">=</span>
                  <span className="text-text-muted">{m.value}</span>
                </div>
                <button onClick={() => deleteMemory(m.key)} className="text-red-400/50 hover:text-red-400 shrink-0">&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log area */}
      <div className="flex-1 overflow-y-auto glass-card p-4 font-mono text-sm space-y-4 mb-4">
        {logs.length === 0 && !loading && (
          <div className="text-text-dim text-center py-8">
            <p className="text-base mb-2">No commands yet</p>
            <p className="text-xs">Type a command below. The agent executes autonomously with full server access.</p>
            <div className="mt-4 text-xs text-text-dim/70 space-y-1">
              <p>Examples:</p>
              <p className="text-text-muted">&gt; check disk space and memory usage</p>
              <p className="text-text-muted">&gt; show pm2 status for all services</p>
              <p className="text-text-muted">&gt; add a new portfolio item for japri.com</p>
              <p className="text-text-muted">&gt; restart rostandy and check if chat works</p>
            </div>
          </div>
        )}

        {logs.map(log => {
          const { commands, outputs } = parseShellData(log);
          const isExpanded = activeLog === log.id;

          return (
            <div key={log.id} className="space-y-1.5">
              {/* Command */}
              <div className="flex items-start gap-2">
                <span className="text-accent shrink-0">&gt;</span>
                <span className="text-text-primary">{log.command}</span>
                <span className="text-text-dim text-[10px] shrink-0 ml-auto">
                  {log.model?.replace('claude-', 'c-').replace('google/', '').replace('openrouter/', 'or/')}
                </span>
              </div>

              {/* Shell commands executed */}
              {commands.length > 0 && (
                <button onClick={() => setActiveLog(isExpanded ? null : log.id)} className="text-[10px] text-text-dim hover:text-text-muted flex items-center gap-1 ml-4">
                  <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>&#9654;</span>
                  {commands.length} shell command{commands.length > 1 ? 's' : ''}
                </button>
              )}

              {isExpanded && commands.map((cmd, i) => (
                <div key={i} className="ml-4 space-y-0.5">
                  <div className="text-amber-400/80 text-xs">$ {cmd}</div>
                  {outputs[i] && (
                    <pre className="text-text-dim text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto bg-bg/50 rounded p-2">{outputs[i]}</pre>
                  )}
                </div>
              ))}

              {/* Response */}
              {log.response && (
                <div className="ml-4 text-text-muted whitespace-pre-wrap text-[13px] leading-relaxed">{log.response}</div>
              )}

              <div className="border-b border-border/30 pt-1" />
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-accent">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">Executing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-2">
        <div className="flex-1 flex items-center gap-2 glass-card px-4">
          <span className="text-accent font-mono shrink-0">&gt;</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent py-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none font-mono"
            placeholder="Type a command..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && execute()}
            disabled={loading}
            autoFocus
          />
        </div>
        <button
          onClick={execute}
          disabled={loading || !input.trim()}
          className="px-5 bg-accent rounded-xl text-white text-sm font-medium disabled:opacity-40 hover:bg-accent/90 active:scale-95 transition-all"
        >
          Run
        </button>
      </div>
    </div>
  );
}
