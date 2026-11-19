import { json } from '@/lib/http';
import { getUser, publicUser } from '@/lib/auth/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  return json({ ok: true, user: user ? publicUser(user) : null });
}
