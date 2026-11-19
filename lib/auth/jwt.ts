/** Edge-safe JWT helpers (used by middleware + server code). */
import { SignJWT, jwtVerify } from 'jose';

export const ADMIN_COOKIE = 'alarad_admin';
export const USER_COOKIE = 'alarad_session';

export type SessionKind = 'admin' | 'user';

const secretOf = (kind: SessionKind) => {
  const raw = kind === 'admin' ? process.env.ADMIN_SESSION_SECRET : process.env.USER_SESSION_SECRET;
  if (!raw || raw.length < 16) throw new Error(`${kind.toUpperCase()}_SESSION_SECRET is missing or too short`);
  return new TextEncoder().encode(raw);
};

export interface SessionPayload {
  sub: string; // id
  kind: SessionKind;
  v?: number; // password/version stamp (admin) — invalidates old tokens after password change
}

export async function signSession(payload: SessionPayload, maxAgeSeconds: number) {
  return new SignJWT({ kind: payload.kind, v: payload.v ?? 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(secretOf(payload.kind));
}

export async function verifySession(token: string | undefined, kind: SessionKind): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretOf(kind), { algorithms: ['HS256'] });
    if (payload.kind !== kind || typeof payload.sub !== 'string') return null;
    return { sub: payload.sub, kind, v: typeof payload.v === 'number' ? payload.v : 0 };
  } catch {
    return null;
  }
}
