import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const agents = db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const { name, description, system_prompt, model, temperature } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const result = db.prepare(
    'INSERT INTO agents (name, description, system_prompt, model, temperature) VALUES (?, ?, ?, ?, ?)'
  ).run(name, description || '', system_prompt || '', model || 'gemini-2.5-flash', temperature ?? 0.7);
  return NextResponse.json({ id: result.lastInsertRowid, success: true });
}

export async function PUT(request: NextRequest) {
  const { id, ...body } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (['name', 'description', 'system_prompt', 'model', 'temperature', 'is_active'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  db.prepare('DELETE FROM agents WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
