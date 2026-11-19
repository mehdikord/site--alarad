'use server';

import type { ReviewStatus } from '@prisma/client';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { id, optStr, str } from '@/lib/admin/form-data';
import { applyReviewToProduct } from '@/lib/services/reviews';

const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

export async function setReviewStatusAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const reviewId = id(fd, 'id');
  const status = str(fd, 'status') as ReviewStatus;
  if (!reviewId || !STATUSES.includes(status)) return fail('درخواست نامعتبر است.');
  await db.$transaction(async (tx) => {
    const r = await tx.review.findUniqueOrThrow({ where: { id: reviewId } });
    if (r.status === status) return;
    await tx.review.update({ where: { id: reviewId }, data: { status } });
    if (status === 'approved') await applyReviewToProduct(r.productId, r.rating, 1, tx);
    else if (r.status === 'approved') await applyReviewToProduct(r.productId, r.rating, -1, tx);
  });
  return ok(status === 'approved' ? 'نظر تأیید و منتشر شد.' : status === 'rejected' ? 'نظر رد شد.' : 'نظر به حالت در انتظار برگشت.');
}

export async function replyReviewAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const reviewId = id(fd, 'id');
  if (!reviewId) return fail('نظر نامعتبر است.');
  const reply = optStr(fd, 'reply');
  if (reply && reply.length > 2000) return fail('پاسخ طولانی است.');
  await db.review.update({ where: { id: reviewId }, data: { adminReply: reply } });
  return ok(reply ? 'پاسخ فروشگاه ثبت شد.' : 'پاسخ حذف شد.');
}

export async function deleteReviewAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const reviewId = id(fd, 'id');
  if (!reviewId) return fail('نظر نامعتبر است.');
  await db.$transaction(async (tx) => {
    const r = await tx.review.findUnique({ where: { id: reviewId } });
    if (!r) return;
    await tx.review.delete({ where: { id: reviewId } });
    if (r.status === 'approved') await applyReviewToProduct(r.productId, r.rating, -1, tx);
  });
  return ok('نظر حذف شد.');
}
