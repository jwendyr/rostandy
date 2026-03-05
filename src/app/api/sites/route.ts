import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const sites = db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
  return NextResponse.json(sites);
}

export async function POST(request: NextRequest) {
  const { name, type, url, port, description, config } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const result = db.prepare('INSERT INTO sites (name, type, url, port, description, config) VALUES (?, ?, ?, ?, ?, ?)').run(
    name, type || 'subdomain', url || '', port || 0, description || '', JSON.stringify(config || {})
  );
  return NextResponse.json({ id: result.lastInsertRowid, success: true });
}

export async function PUT(request: NextRequest) {
  const { id, ...body } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (['name', 'type', 'url', 'port', 'status', 'description', 'config'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(key === 'config' ? JSON.stringify(val) : val);
    }
  }
  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE sites SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  db.prepare('DELETE FROM sites WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
