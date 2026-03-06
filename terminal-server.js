const WebSocket = require('ws');
const pty = require('node-pty');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const PORT = 3016;
const DB_PATH = path.join(__dirname, 'data', 'rostandy.db');
const JWT_SECRET = process.env.JWT_SECRET || 'rostandy-jwt-secret-2026-change-me';

// Minimal HS256 JWT verification (no external deps)
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

    // Check expiration
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

const wss = new WebSocket.Server({ port: PORT, host: '127.0.0.1' });

wss.on('connection', (ws, req) => {
  const wallet = authenticate(req.headers.cookie);
  if (!wallet) {
    ws.send('\r\n\x1b[31mUnauthorized. Please log in at /login\x1b[0m\r\n');
    ws.close();
    return;
  }

  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;
  delete cleanEnv.CLAUDE_CODE_SESSION;

  const shell = pty.spawn('su', ['-', 'ucok', '-c', 'cd /home/rostandy && claude --dangerously-skip-permissions'], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: '/home/rostandy',
    env: {
      ...cleanEnv,
      TERM: 'xterm-256color',
    },
  });

  shell.onData((data) => {
    try { ws.send(data); } catch {}
  });

  shell.onExit(() => {
    try { ws.close(); } catch {}
  });

  ws.on('message', (msg) => {
    const str = msg.toString();
    if (str.startsWith('\x01RESIZE:')) {
      const [cols, rows] = str.slice(8).split(',').map(Number);
      if (cols > 0 && rows > 0) shell.resize(cols, rows);
      return;
    }
    shell.write(str);
  });

  ws.on('close', () => {
    shell.kill();
  });
});

console.log(`Terminal WebSocket server listening on 127.0.0.1:${PORT}`);
