'use client';

import { useEffect, useRef } from 'react';

export default function ControlPage() {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<unknown>(null);

  useEffect(() => {
    if (!termRef.current || xtermRef.current) return;

    let ws: WebSocket | null = null;
    let terminal: unknown = null;
    let fitAddon: unknown = null;

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
          cursor: '#7c5bf0',
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
      fitAddon = fit;
      xtermRef.current = term;

      // Connect WebSocket
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}/ws/terminal`);

      ws.onopen = () => {
        // Send initial size
        ws!.send(`\x01RESIZE:${term.cols},${term.rows}`);
      };

      ws.onmessage = (e) => {
        term.write(e.data);
      };

      ws.onclose = () => {
        term.write('\r\n\x1b[31m[Connection closed. Refresh to reconnect.]\x1b[0m\r\n');
      };

      ws.onerror = () => {
        term.write('\r\n\x1b[31m[WebSocket error. Check terminal server.]\x1b[0m\r\n');
      };

      term.onData((data: string) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(`\x01RESIZE:${cols},${rows}`);
        }
      });

      const onResize = () => fit.fit();
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
      };
    }

    const cleanup = init();

    return () => {
      cleanup.then((fn) => fn?.());
      ws?.close();
      if (terminal && typeof (terminal as { dispose: () => void }).dispose === 'function') {
        (terminal as { dispose: () => void }).dispose();
      }
      xtermRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Terminal</h1>
          <p className="text-text-muted text-sm mt-0.5">Full server shell access</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>bash</span>
        </div>
      </div>
      <div
        ref={termRef}
        className="flex-1 rounded-xl overflow-hidden border border-border/50"
        style={{ padding: '8px', background: '#0a0a0f' }}
      />
    </div>
  );
}
