import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const plans = db.prepare('SELECT * FROM plans ORDER BY created_at DESC').all();
  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  const { title, description, steps, priority, category } = await request.json();
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const result = db.prepare(
    'INSERT INTO plans (title, description, steps, priority, category) VALUES (?, ?, ?, ?, ?)'
  ).run(title, description || '', JSON.stringify(steps || []), priority || 'medium', category || 'feature');

  // Auto-create portfolio entry when a plan is created
  db.prepare(
    'INSERT INTO portfolio (title, description, category, status, plan_id) VALUES (?, ?, ?, ?, ?)'
  ).run(title, description || '', category || 'project', 'planned', result.lastInsertRowid);

  return NextResponse.json({ id: result.lastInsertRowid, success: true });
}
