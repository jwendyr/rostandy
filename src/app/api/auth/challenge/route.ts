import { NextRequest, NextResponse } from 'next/server';
import { createNonce } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { wallet } = await request.json();
    if (!wallet || typeof wallet !== 'string') {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }
    const nonce = createNonce(wallet);
    const message = `Sign this message to authenticate with Rostandy Admin.\n\nWallet: ${wallet}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
    return NextResponse.json({ nonce, message });
  } catch {
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}
