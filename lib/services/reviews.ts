import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

type Tx = Prisma.TransactionClient;

/**
 * Keeps products.rating / products.review_count in sync when a review becomes
 * (or stops being) approved. `direction` = +1 when approved, -1 when un-approved/deleted.
 */
export async function applyReviewToProduct(productId: bigint, rating: number, direction: 1 | -1, tx: Tx | typeof db = db) {
  const p = await tx.product.findUnique({ where: { id: productId }, select: { rating: true, reviewCount: true } });
  if (!p) return;
  const count = p.reviewCount;
  const avg = Number(p.rating);
  const nextCount = Math.max(0, count + direction);
  const nextAvg = nextCount === 0 ? 0 : (avg * count + direction * rating) / nextCount;
  await tx.product.update({
    where: { id: productId },
    data: { reviewCount: nextCount, rating: Math.min(5, Math.max(0, Math.round(nextAvg * 10) / 10)) },
  });
}
