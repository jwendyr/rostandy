import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  // Handle queue action
  if (body.action === 'queue') {
    db.prepare("UPDATE plans SET queue_status = 'queued', updated_at = datetime('now') WHERE id = ?").run(id);
    return NextResponse.json({ success: true, queued: true });
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(body)) {
    if (['title', 'description', 'steps', 'status', 'priority', 'category', 'queue_status', 'queue_result'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(key === 'steps' ? JSON.stringify(val) : val);
    }
  }

  if (body.status === 'completed') {
    fields.push("completed_at = datetime('now')");
    // Update linked portfolio item
    db.prepare("UPDATE portfolio SET status = 'completed', updated_at = datetime('now') WHERE plan_id = ?").run(id);
  } else if (body.status === 'in-progress') {
    db.prepare("UPDATE portfolio SET status = 'in-progress', updated_at = datetime('now') WHERE plan_id = ?").run(id);
  }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare('DELETE FROM plans WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
