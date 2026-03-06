const WebSocket = require('ws');
const pty = require('node-pty');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

const PORT_CLAUDE = 3016;
const PORT_ROOT = 3017;
const DB_PATH = path.join(__dirname, 'data', 'rostandy.db');
const JWT_SECRET = process.env.JWT_SECRET || 'rostandy-jwt-secret-2026-change-me';

function verifyJWT(token) {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;
    const key = Buffer.from(JWT_SECRET, 'utf-8');
    const expected = crypto.createHmac('sha256', key)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    if (expected !== sigB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function authenticate(cookie) {
  if (!cookie) return null;
  const match = cookie.match(/rostandy-session=([^;\s]+)/);
  if (!match) return null;
  const payload = verifyJWT(match[1]);
  if (!payload?.wallet) return null;
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const row = db.prepare('SELECT address FROM admin_wallets WHERE address = ?').get(payload.wallet);
    db.close();
    return row ? payload.wallet : null;
  } catch {
    return null;
  }
}

function setupTerminal(port, spawnFn, label) {
  const wss = new WebSocket.Server({ port, host: '127.0.0.1' });

  wss.on('connection', (ws, req) => {
    const wallet = authenticate(req.headers.cookie);
    if (!wallet) {
      ws.send('\r\n\x1b[31mUnauthorized. Please log in at /login\x1b[0m\r\n');
      ws.close();
      return;
    }

    let shell = null;
    let cols = 120, rows = 30;
    let closed = false;

    function spawnShell() {
      const cleanEnv = { ...process.env };
      delete cleanEnv.CLAUDECODE;
      delete cleanEnv.CLAUDE_CODE_SESSION;

      shell = spawnFn(cleanEnv, cols, rows);

      shell.onData((data) => {
        try { ws.send(data); } catch {}
      });

      shell.onExit(({ exitCode }) => {
        shell = null;
        if (closed) return;
        const msg = exitCode === 0
          ? `\r\n\x1b[33m[Process exited. Respawning in 2s...]\x1b[0m\r\n`
          : `\r\n\x1b[31m[Process exited with code ${exitCode}. Respawning in 3s...]\x1b[0m\r\n`;
        try { ws.send(msg); } catch {}
        const delay = exitCode === 0 ? 2000 : 3000;
        setTimeout(() => {
          if (!closed) spawnShell();
        }, delay);
      });
    }

    spawnShell();

    ws.on('message', (msg) => {
      const str = msg.toString();
      if (str.startsWith('\x01RESIZE:')) {
        const [c, r] = str.slice(8).split(',').map(Number);
        if (c > 0 && r > 0) {
          cols = c; rows = r;
          if (shell) shell.resize(c, r);
        }
        return;
      }
      if (shell) shell.write(str);
    });

    ws.on('close', () => {
      closed = true;
      if (shell) shell.kill();
    });
  });

  console.log(`${label} terminal on 127.0.0.1:${port}`);
}

// Claude terminal (user: ucok, bash shell that auto-launches claude)
setupTerminal(PORT_CLAUDE, (env, cols, rows) => {
  const shell = pty.spawn('su', ['-', 'ucok'], {
    name: 'xterm-256color', cols, rows, cwd: '/home/rostandy',
    env: { ...env, TERM: 'xterm-256color' },
  });
  // Auto-launch claude after shell initializes
  setTimeout(() => {
    shell.write('cd /home/rostandy && claude --dangerously-skip-permissions\n');
  }, 500);
  return shell;
}, 'Claude');

// Root terminal (user: root, plain bash)
setupTerminal(PORT_ROOT, (env, cols, rows) => {
  return pty.spawn('bash', ['--login'], {
    name: 'xterm-256color', cols, rows, cwd: '/home/rostandy',
    env: {
      ...env,
      TERM: 'xterm-256color',
      HOME: '/root',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.local/bin:/root/.cargo/bin',
    },
  });
}, 'Root');
