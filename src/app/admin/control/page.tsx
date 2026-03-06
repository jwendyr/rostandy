'use client';

import { useEffect, useRef, useState } from 'react';

type TermMode = 'claude' | 'root';

const WS_PATHS: Record<TermMode, string> = {
  claude: '/ws/terminal',
  root: '/ws/terminal-root',
};

const LABELS: Record<TermMode, { title: string; desc: string; badge: string; color: string }> = {
  claude: { title: 'Claude Agent', desc: 'AI assistant with full server access', badge: 'claude', color: 'bg-accent' },
  root: { title: 'Root Terminal', desc: 'Direct bash shell as root', badge: 'root', color: 'bg-red-500' },
};

export default function ControlPage() {
  const [mode, setMode] = useState<TermMode>('root');
  const [key, setKey] = useState(0);
  const termRef = useRef<HTMLDivElement>(null);

  // Force remount on mode change
  function switchMode(m: TermMode) {
    if (m === mode) return;
    setMode(m);
    setKey(k => k + 1);
  }

  const info = LABELS[mode];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{info.title}</h1>
          <p className="text-text-muted text-sm mt-0.5">{info.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            <button
              onClick={() => switchMode('root')}
              className={`px-3 py-1.5 transition-colors ${mode === 'root' ? 'bg-red-500/15 text-red-400 font-medium' : 'text-text-muted hover:text-text-primary'}`}
            >
              Root
            </button>
            <button
              onClick={() => switchMode('claude')}
              className={`px-3 py-1.5 transition-colors border-l border-border ${mode === 'claude' ? 'bg-accent/15 text-accent font-medium' : 'text-text-muted hover:text-text-primary'}`}
            >
              Claude
            </button>
          </div>
          <span className={`w-2 h-2 rounded-full animate-pulse ${info.color}`} />
          <span className="text-xs text-text-dim">{info.badge}</span>
        </div>
      </div>
      <TerminalView key={key} wsPath={WS_PATHS[mode]} cursorColor={mode === 'root' ? '#ef4444' : '#7c5bf0'} />
    </div>
  );
}

function TerminalView({ wsPath, cursorColor }: { wsPath: string; cursorColor: string }) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<unknown>(null);

  useEffect(() => {
    if (!termRef.current || xtermRef.current) return;

    let ws: WebSocket | null = null;
    let terminal: { dispose: () => void; write: (d: string) => void; cols: number; rows: number; onData: (cb: (d: string) => void) => { dispose: () => void }; onResize: (cb: (s: { cols: number; rows: number }) => void) => { dispose: () => void } } | null = null;
    let removeResize: (() => void) | null = null;
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connectWs() {
      if (disposed || !terminal) return;
      const term = terminal;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}${wsPath}`);

      ws.onopen = () => ws!.send(`\x01RESIZE:${term.cols},${term.rows}`);
      ws.onmessage = (e) => term.write(e.data);
      ws.onclose = () => {
        if (disposed) return;
        term.write('\r\n\x1b[33m[Disconnected. Reconnecting in 3s...]\x1b[0m\r\n');
        reconnectTimer = setTimeout(() => connectWs(), 3000);
      };
      ws.onerror = () => {};
    }

    async function init() {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');
      // @ts-expect-error CSS import
      await import('@xterm/xterm/css/xterm.css');

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
        theme: {
          background: '#0a0a0f',
          foreground: '#e0e0e8',
          cursor: cursorColor,
          selectionBackground: '#7c5bf044',
          black: '#1a1a2e',
          red: '#ff6b6b',
          green: '#51cf66',
          yellow: '#ffd43b',
          blue: '#7c5bf0',
          magenta: '#cc5de8',
          cyan: '#22b8cf',
          white: '#e0e0e8',
          brightBlack: '#4a4a5e',
          brightRed: '#ff8787',
          brightGreen: '#69db7c',
          brightYellow: '#ffe066',
          brightBlue: '#9775fa',
          brightMagenta: '#e599f7',
          brightCyan: '#3bc9db',
          brightWhite: '#f8f9fa',
        },
        allowProposedApi: true,
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.loadAddon(new WebLinksAddon());
      term.open(termRef.current!);
      fit.fit();

      terminal = term;
      xtermRef.current = term;

      // Register input handlers ONCE — they read `ws` by reference
      term.onData((data: string) => {
        if (ws?.readyState === WebSocket.OPEN) ws.send(data);
      });
      term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (ws?.readyState === WebSocket.OPEN) ws.send(`\x01RESIZE:${cols},${rows}`);
      });

      connectWs();

      const onResize = () => fit.fit();
      window.addEventListener('resize', onResize);
      removeResize = () => window.removeEventListener('resize', onResize);
    }

    init();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      removeResize?.();
      ws?.close();
      terminal?.dispose();
      xtermRef.current = null;
    };
  }, [wsPath, cursorColor]);

  return (
    <div
      ref={termRef}
      className="flex-1 rounded-xl overflow-hidden border border-border/50"
      style={{ padding: '8px', background: '#0a0a0f' }}
    />
  );
}
