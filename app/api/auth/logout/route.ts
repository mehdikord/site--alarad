import { json } from '@/lib/http';
import { endUserSession } from '@/lib/auth/user';

export async function POST() {
  await endUserSession();
  return json({ ok: true });
}
