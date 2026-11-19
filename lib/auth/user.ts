import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { db, toId } from '@/lib/db';
import { USER_COOKIE, signSession, verifySession } from '@/lib/auth/jwt';

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function startUserSession(userId: bigint) {
  const token = await signSession({ sub: userId.toString(), kind: 'user' }, MAX_AGE);
  (await cookies()).set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endUserSession() {
  (await cookies()).delete(USER_COOKIE);
}

export const getUser = cache(async () => {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  const session = await verifySession(token, 'user');
  const id = toId(session?.sub);
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id } });
  if (!user || !user.isActive) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export const publicUser = (u: CurrentUser) => ({
  id: Number(u.id),
  name: u.name ?? '',
  phone: u.phone,
  email: u.email ?? '',
});
