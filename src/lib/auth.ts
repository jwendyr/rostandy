import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'rostandy-session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return new TextEncoder().encode(secret);
}

export interface Session {
  wallet: string;
  label: string;
  role: string;
}

export async function createSession(wallet: string, label: string, role: string): Promise<string> {
  return new SignJWT({ wallet, label, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { wallet: payload.wallet as string, label: payload.label as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION,
  };
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

// In-memory nonce store with TTL
const nonceStore = new Map<string, { wallet: string; expires: number }>();

export function createNonce(wallet: string): string {
  const now = Date.now();
  for (const [key, val] of nonceStore) {
    if (val.expires < now) nonceStore.delete(key);
  }
  const nonce = crypto.randomUUID();
  nonceStore.set(nonce, { wallet, expires: now + 5 * 60 * 1000 });
  return nonce;
}

export function consumeNonce(nonce: string): string | null {
  const entry = nonceStore.get(nonce);
  if (!entry || entry.expires < Date.now()) {
    if (entry) nonceStore.delete(nonce);
    return null;
  }
  nonceStore.delete(nonce);
  return entry.wallet;
}
