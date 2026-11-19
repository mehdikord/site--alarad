import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySession } from '@/lib/auth/jwt';

/** Gate /admins/* (except the login page) and /api/admin/* behind a valid admin session. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === '/admins/login';
  const session = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value, 'admin');

  if (pathname.startsWith('/api/admin')) {
    if (!session) return NextResponse.json({ ok: false, message: 'دسترسی غیرمجاز' }, { status: 401 });
    return NextResponse.next();
  }

  if (isLogin) {
    if (session) return NextResponse.redirect(new URL('/admins', req.url));
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL('/admins/login', req.url);
    if (pathname !== '/admins') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admins', '/admins/:path*', '/api/admin/:path*'] };
