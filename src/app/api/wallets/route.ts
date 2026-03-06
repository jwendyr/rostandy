import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface Wallet { id: number; address: string; label: string; role: string; created_at: string }

export async function GET() {
  const wallets = db.prepare('SELECT * FROM admin_wallets ORDER BY id').all() as Wallet[];
  return NextResponse.json(wallets);
}

export async function POST(request: NextRequest) {
  const { address, label, role } = await request.json();
  if (!address || address.length < 32) {
    return NextResponse.json({ error: 'Valid Solana wallet address required' }, { status: 400 });
  }
  try {
    db.prepare('INSERT INTO admin_wallets (address, label, role) VALUES (?, ?, ?)').run(
      address.trim(), label || '', role || 'admin'
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Wallet already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { id, label, role } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  db.prepare('UPDATE admin_wallets SET label = ?, role = ? WHERE id = ?').run(label || '', role || 'admin', id);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const remaining = (db.prepare('SELECT COUNT(*) as count FROM admin_wallets').get() as { count: number }).count;
  if (remaining <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last admin wallet' }, { status: 400 });
  }
  db.prepare('DELETE FROM admin_wallets WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
