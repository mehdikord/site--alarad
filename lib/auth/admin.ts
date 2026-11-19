import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, toId } from '@/lib/db';
import { ADMIN_COOKIE, signSession, verifySession } from '@/lib/auth/jwt';

const MAX_AGE = 60 * 60 * 12; // 12h

/** password stamp — changing the password invalidates every older admin token */
export const passwordStamp = (hash: string) => {
  let h = 0;
  for (let i = 0; i < hash.length; i++) h = (Math.imul(31, h) + hash.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export async function startAdminSession(admin: { id: bigint; password: string }) {
  const token = await signSession({ sub: admin.id.toString(), kind: 'admin', v: passwordStamp(admin.password) }, MAX_AGE);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

/** current admin (or null) — memoised per request */
export const getAdmin = cache(async () => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = await verifySession(token, 'admin');
  const id = toId(session?.sub);
  if (!session || !id) return null;
  const admin = await db.admin.findUnique({ where: { id } });
  if (!admin || !admin.isActive || passwordStamp(admin.password) !== session.v) return null;
  return { id: admin.id, name: admin.name, phone: admin.phone };
});

export type CurrentAdmin = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

/** use in admin pages / server actions */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getAdmin();
  if (!admin) redirect('/admins/login');
  return admin;
}
