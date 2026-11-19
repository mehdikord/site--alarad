import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma, ReviewStatus } from '@prisma/client';
import { Star } from 'lucide-react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui';
import { ActionForm, ConfirmAction, SubmitButton, TextArea } from '@/components/admin/form';
import { Badge, FilterTabs, Pagination, SearchBar, fa, paging } from '@/components/admin/table';
import { fDateTime, one, type SP } from '@/lib/admin/sales/shared';
import { deleteReviewAction, replyReviewAction, setReviewStatusAction } from './actions';

export const metadata: Metadata = { title: 'نظرها' };

const META: Record<ReviewStatus, { label: string; tone: string }> = {
  pending: { label: 'در انتظار بررسی', tone: 'bg-cream-200 text-ink-700' },
  approved: { label: 'منتشر شده', tone: 'bg-sage-100 text-sage-700' },
  rejected: { label: 'رد شده', tone: 'bg-blush-100 text-blush-500' },
};
const STATUSES = Object.keys(META) as ReviewStatus[];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = one(sp.status) || 'pending';
  const q = one(sp.q).trim();
  const { page, skip, take } = paging(one(sp.page), 15);

  const base: Prisma.ReviewWhereInput = q
    ? { OR: [{ body: { contains: q } }, { authorName: { contains: q } }, { product: { name: { contains: q } } }] }
    : {};
  const where: Prisma.ReviewWhereInput = STATUSES.includes(status as ReviewStatus) ? { ...base, status: status as ReviewStatus } : base;

  const [rows, total, groups] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { product: { select: { id: true, name: true, slug: true } }, user: { select: { id: true, phone: true } } },
    }),
    db.review.count({ where }),
    db.review.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all])) as Record<string, number>;
  const href = (s: string) => `/admins/reviews?${new URLSearchParams({ status: s, ...(q ? { q } : {}) })}`;

  return (
    <>
      <AdminPageHeader title="نظرهای مشتریان" description="تأیید، رد یا پاسخ به نظرهای ثبت‌شده برای محصولات" />
      <FilterTabs
        active={STATUSES.includes(status as ReviewStatus) ? status : 'all'}
        items={[
          ...STATUSES.map((s) => ({ value: s, label: META[s].label, href: href(s), count: counts[s] ?? 0 })),
          { value: 'all', label: 'همه', href: href('all'), count: groups.reduce((s, g) => s + g._count._all, 0) },
        ]}
      />
      <SearchBar action="/admins/reviews" defaultValue={q} placeholder="متن نظر، نام نویسنده یا محصول…" hidden={{ status }} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line-soft bg-white py-14 text-center text-[0.8125rem] text-ink-400">نظری در این بخش نیست.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={String(r.id)} className="rounded-xl border border-line-soft bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.8125rem] font-medium text-ink-900">{r.authorName}</span>
                    {r.isVerifiedBuyer && <Badge tone="bg-sage-100 text-sage-700">خریدار</Badge>}
                    <Badge tone={META[r.status].tone}>{META[r.status].label}</Badge>
                    <span className="flex items-center gap-0.5" aria-label={`${r.rating} از ۵`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`size-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-cream-300'}`} />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.6875rem] text-ink-400">
                    برای{' '}
                    <Link href={`/admins/products/${r.product.id}`} className="text-sage-700 hover:underline">{r.product.name}</Link>
                    {' · '}
                    {fDateTime(r.createdAt)}
                    {r.user && (
                      <>
                        {' · '}
                        <Link href={`/admins/users/${r.user.id}`} className="hover:underline" dir="ltr">{r.user.phone}</Link>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.status !== 'approved' && (
                    <ConfirmAction action={setReviewStatusAction} fields={{ id: String(r.id), status: 'approved' }} confirm="این نظر منتشر شود؟" variant="sage" label="تأیید و انتشار" />
                  )}
                  {r.status !== 'rejected' && (
                    <ConfirmAction action={setReviewStatusAction} fields={{ id: String(r.id), status: 'rejected' }} confirm="این نظر رد شود؟" variant="outline" label="رد" />
                  )}
                  <ConfirmAction action={deleteReviewAction} fields={{ id: String(r.id) }} confirm="این نظر برای همیشه حذف شود؟" label="حذف" />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-[0.8125rem] leading-7 text-ink-700">{r.body}</p>
              <details className="mt-3" open={!!r.adminReply}>
                <summary className="cursor-pointer text-[0.75rem] text-sage-700">{r.adminReply ? 'پاسخ فروشگاه' : 'نوشتن پاسخ فروشگاه'}</summary>
                <ActionForm action={replyReviewAction} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={String(r.id)} />
                  <TextArea name="reply" defaultValue={r.adminReply ?? ''} rows={2} placeholder="پاسخ شما زیر نظر نمایش داده می‌شود…" />
                  <SubmitButton size="sm" variant="outline">ذخیرهٔ پاسخ</SubmitButton>
                </ActionForm>
              </details>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pages={Math.ceil(total / take)} total={total} basePath="/admins/reviews" params={{ status, q }} />
      <p className="mt-2 text-[0.6875rem] text-ink-300">امتیاز و تعداد نظر هر محصول با تأیید یا حذف نظرها خودکار به‌روز می‌شود. ({fa(total)} مورد)</p>
    </>
  );
}
