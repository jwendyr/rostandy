import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const settings = db.prepare('SELECT * FROM settings ORDER BY category, key').all() as Array<{
    key: string; value: string; category: string; is_secret: number; description: string;
  }>;
  // Mask secret values
  const masked = settings.map(s => ({
    ...s,
    value: s.is_secret ? (s.value ? '***' + s.value.slice(-4) : '') : s.value,
  }));
  return NextResponse.json(masked);
}

export async function POST(request: NextRequest) {
  const { key, value, category, is_secret, description } = await request.json();
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

  db.prepare(
    `INSERT INTO settings (key, value, category, is_secret, description, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = ?, category = ?, is_secret = ?, description = ?, updated_at = datetime('now')`
  ).run(key, value || '', category || 'general', is_secret ? 1 : 0, description || '', value || '', category || 'general', is_secret ? 1 : 0, description || '');

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const { action } = await request.json();

  if (action === 'sync-to-env') {
    const settings = db.prepare("SELECT key, value FROM settings WHERE value != ''").all() as Array<{ key: string; value: string }>;
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch { /* empty */ }

    for (const s of settings) {
      const regex = new RegExp(`^${s.key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${s.key}=${s.value}`);
      } else {
        envContent += `\n${s.key}=${s.value}`;
      }
    }
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    return NextResponse.json({ success: true, message: 'Synced to .env' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const { key } = await request.json();
  db.prepare('DELETE FROM settings WHERE key = ?').run(key);
  return NextResponse.json({ success: true });
}
