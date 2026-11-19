import { db, toId } from '@/lib/db';
import { bad, json, readJson } from '@/lib/http';
import { getUser } from '@/lib/auth/user';
import { getSettings } from '@/lib/settings';
import { applyReviewToProduct } from '@/lib/services/reviews';

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad('برای ثبت نظر ابتدا وارد حساب شوید.', 401);
  const b = await readJson<{ productId?: string; rating?: number; body?: string }>(req);
  const productId = toId(String(b.productId ?? ''));
  const rating = Math.round(Number(b.rating));
  const body = String(b.body ?? '').trim().slice(0, 2000);
  if (!productId) return bad('محصول نامعتبر است.', 422);
  if (!(rating >= 1 && rating <= 5)) return bad('امتیاز باید بین ۱ تا ۵ باشد.', 422);
  if (body.length < 10) return bad('متن نظر باید حداقل ۱۰ حرف باشد.', 422);
  const product = await db.product.findFirst({ where: { id: productId, status: 'active' }, select: { id: true } });
  if (!product) return bad('محصول پیدا نشد.', 404);
  const recent = await db.review.count({ where: { userId: user.id, productId, createdAt: { gt: new Date(Date.now() - 86_400_000) } } });
  if (recent > 0) return bad('شما امروز برای این محصول نظر ثبت کرده‌اید.', 429);

  const bought = await db.orderItem.count({ where: { productId, order: { userId: user.id, paymentStatus: 'paid' } } });
  const auto = (await getSettings()).reviewsAutoApprove;
  await db.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        productId,
        userId: user.id,
        authorName: user.name?.trim() || 'کاربر الاردشاپ',
        rating,
        body,
        status: auto ? 'approved' : 'pending',
        isVerifiedBuyer: bought > 0,
      },
    });
    if (auto) await applyReviewToProduct(productId, rating, 1, tx);
  });
  return json({ ok: true, message: auto ? 'نظر شما منتشر شد.' : 'نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.' });
}
