import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const domains = db.prepare('SELECT * FROM domains ORDER BY domain ASC').all();
  return NextResponse.json(domains);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 });
  const result = db.prepare(
    'INSERT INTO domains (domain, registrar, expiry_date, nameservers, dns_provider, cloudflare_zone_id, ssl_status, mail_provider, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(body.domain, body.registrar || '', body.expiry_date || '', body.nameservers || '', body.dns_provider || 'cloudflare', body.cloudflare_zone_id || '', body.ssl_status || 'unknown', body.mail_provider || 'none', body.notes || '');
  return NextResponse.json({ id: result.lastInsertRowid, success: true });
}

export async function PUT(request: NextRequest) {
  const { id, ...body } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (['domain', 'registrar', 'expiry_date', 'nameservers', 'dns_provider', 'cloudflare_zone_id', 'ssl_status', 'mail_provider', 'status', 'notes'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE domains SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  db.prepare('DELETE FROM domains WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
