import 'server-only';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export const json = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status });
export const bad = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, message, ...extra }, { status });

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
}

export async function userAgent() {
  return ((await headers()).get('user-agent') ?? '').slice(0, 500) || null;
}
