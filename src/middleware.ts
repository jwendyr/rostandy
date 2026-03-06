import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isProtectedApi = pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/chat') &&
    !pathname.startsWith('/api/portfolio');

  if (!isAdminRoute && !isProtectedApi) return NextResponse.next();

  const token = request.cookies.get('rostandy-session')?.value;
  if (!token) {
    if (isAdminRoute) return NextResponse.redirect(new URL('/login', request.url));
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session) {
    if (isAdminRoute) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('rostandy-session');
      return response;
    }
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/plans/:path*', '/api/sites/:path*', '/api/domains/:path*', '/api/agents/:path*', '/api/wallets/:path*', '/api/control/:path*', '/api/settings/:path*'],
};
