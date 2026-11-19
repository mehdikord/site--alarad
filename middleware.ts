import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySession } from '@/lib/auth/jwt';

/**
 * Public origin of the site. Behind a reverse proxy `req.url` is the internal
 * address (e.g. http://localhost:3077), so prefer APP_URL, then the proxy headers.
 * (Next requires an absolute URL in a middleware `Location` header.)
 */
function publicOrigin(req: NextRequest) {
  const env = (process.env.APP_URL ?? '').trim().replace(/\/$/, '');
  if (env && !/\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(env)) {
    try {
      return new URL(env).origin;
    } catch {
      // malformed APP_URL — fall through
    }
  }
  const host = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || req.headers.get('host');
  if (host && !/^(localhost|127\.0\.0\.1)(:|$)/.test(host)) {
    const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.nextUrl.protocol.replace(':', '');
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}

const redirectTo = (req: NextRequest, path: string) => NextResponse.redirect(new URL(path, publicOrigin(req)), 307);

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
    if (session) return redirectTo(req, '/admins');
    return NextResponse.next();
  }

  if (!session) {
    const next = pathname !== '/admins' ? `?next=${encodeURIComponent(pathname)}` : '';
    return redirectTo(req, `/admins/login${next}`);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admins', '/admins/:path*', '/api/admin/:path*'] };
