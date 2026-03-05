import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const items = db.prepare('SELECT * FROM portfolio ORDER BY sort_order ASC').all();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const { title, description, category, tech_stack, url, github_url, status, sort_order } = await request.json();
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const result = db.prepare(
    'INSERT INTO portfolio (title, description, category, tech_stack, url, github_url, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description || '', category || 'project', tech_stack || '', url || '', github_url || '', status || 'in-progress', sort_order || 0);

  return NextResponse.json({ id: result.lastInsertRowid, success: true });
}

export async function PUT(request: NextRequest) {
  const { id, ...body } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (['title', 'description', 'category', 'tech_stack', 'url', 'github_url', 'image_url', 'status', 'sort_order'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE portfolio SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  db.prepare('DELETE FROM portfolio WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
