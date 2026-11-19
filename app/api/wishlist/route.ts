import { db, toId } from '@/lib/db';
import { bad, json, readJson } from '@/lib/http';
import { getUser } from '@/lib/auth/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return bad('ابتدا وارد حساب شوید.', 401);
  const rows = await db.wishlist.findMany({
    where: { userId: user.id, product: { status: 'active' } },
    include: { product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' }, include: { media: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return json({
    ok: true,
    items: rows.map((w) => ({
      productId: Number(w.productId),
      slug: w.product.slug,
      name: w.product.name,
      price: w.product.price,
      image: w.product.images[0]?.media.url ?? null,
    })),
  });
}

/** toggle */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad('ابتدا وارد حساب شوید.', 401);
  const productId = toId(String((await readJson<{ productId?: string }>(req)).productId ?? ''));
  if (!productId || !(await db.product.findUnique({ where: { id: productId }, select: { id: true } }))) return bad('محصول پیدا نشد.', 404);
  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await db.wishlist.findUnique({ where: key });
  if (existing) await db.wishlist.delete({ where: key });
  else await db.wishlist.create({ data: { userId: user.id, productId } });
  return json({ ok: true, wishlisted: !existing });
}
