import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySession } from '@/lib/auth/jwt';

/**
 * Relative redirect: the browser resolves it against the domain it is already on.
 * (Behind a reverse proxy `req.url` is the internal address, e.g. localhost:3077.)
 */
const redirectTo = (location: string) => new NextResponse(null, { status: 307, headers: { Location: location } });

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
    if (session) return redirectTo('/admins');
    return NextResponse.next();
  }

  if (!session) {
    const next = pathname !== '/admins' ? `?next=${encodeURIComponent(pathname)}` : '';
    return redirectTo(`/admins/login${next}`);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admins', '/admins/:path*', '/api/admin/:path*'] };
