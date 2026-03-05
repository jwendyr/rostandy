import { NextRequest, NextResponse } from 'next/server';
import { consumeNonce, createSession, sessionCookieOptions } from '@/lib/auth';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { publicKey, signature, nonce, message, type } = await request.json();
    if (!publicKey || !signature || !nonce || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expectedWallet = consumeNonce(nonce);
    if (!expectedWallet || expectedWallet !== publicKey) {
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 400 });
    }

    const messageBytes = type === 'transaction' ? bs58.decode(message) : new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const wallet = db.prepare('SELECT * FROM admin_wallets WHERE address = ?').get(publicKey) as {
      address: string; label: string; role: string;
    } | undefined;

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not authorized' }, { status: 403 });
    }

    const token = await createSession(wallet.address, wallet.label, wallet.role);
    const response = NextResponse.json({ success: true, wallet: wallet.address, label: wallet.label, role: wallet.role });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    console.error('Auth verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
