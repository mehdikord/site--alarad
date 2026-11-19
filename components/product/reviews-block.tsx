'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { Stars } from '@/components/ui/misc';
import { num, timeAgo } from '@/lib/format';
import { useAuth, useUi, api } from '@/lib/store';
import type { Review } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ReviewsBlock({
  reviews,
  rating,
  reviewCount,
  productId,
}: {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  productId: string;
}) {
  // distribution from the loaded (approved) reviews
  const total = reviews.length || 1;
  const dist = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => Math.round(r.rating) === star).length / total);

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-line-soft pt-10">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
        <div>
          <h2 className="text-h2 text-ink-900">نظر خریداران</h2>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-[2.25rem] font-semibold leading-none text-ink-900">{num(rating)}</span>
            <div className="pb-1">
              <Stars rating={rating} size={14} />
              <p className="mt-1 text-[0.6875rem] text-ink-400">از {num(reviewCount)} نظر تأییدشده</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1.5">
            {dist.map((pct, i) => (
              <li key={i} className="flex items-center gap-2 text-[0.625rem] text-ink-400">
                <span className="w-3 fa-num">{num(5 - i)}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                  <motion.span
                    className="block h-full rounded-full bg-sage-400"
                    initial={{width: 0}}
                    whileInView={{ width: `${pct * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
                <span className="w-8 text-end fa-num">{num(Math.round(pct * 100))}٪</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
        <ReviewForm productId={productId} />
        {reviews.length === 0 && (
          <p className="rounded-xl bg-cream-100 px-4 py-6 text-center text-[0.8125rem] text-ink-400">
            هنوز نظری ثبت نشده — اولین نفری باشید که تجربه‌اش را می‌نویسد.
          </p>
        )}
        <ul className="divide-y divide-line-soft">
          {reviews.map((r, i) => (
            <motion.li
              key={r.id}
              initial={{opacity: 0, y: 14}}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className={cn('py-5 first:pt-0 last:pb-0')}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-cream-200 text-[0.625rem] font-medium text-ink-600">
                    {r.author.slice(0, 1)}
                  </span>
                  <span className="text-[0.75rem] font-medium text-ink-900">{r.author}</span>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-[0.625rem] text-sage-700">
                      <BadgeCheck className="size-3" strokeWidth={2} />
                      خرید تأییدشده
                    </span>
                  )}
                </div>
                <Stars rating={r.rating} size={11} />
              </div>
              <p className="mt-2 text-[0.8125rem] leading-[2] text-ink-600">{r.body}</p>
              {r.reply && (
                <div className="mt-2.5 rounded-lg border-s-2 border-sage-300 bg-sage-50/70 px-3 py-2 text-[0.75rem] leading-[1.9] text-ink-600">
                  <span className="font-medium text-sage-700">پاسخ الاردشاپ: </span>
                  {r.reply}
                </div>
              )}
              <p className="mt-1.5 text-[0.625rem] text-ink-300">{timeAgo(r.date)}</p>
            </motion.li>
          ))}
        </ul>
        </div>
      </div>
    </section>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const user = useAuth((s) => s.user);
  const notify = useUi((s) => s.notify);
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [body, setBody] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (done) {
    return (
      <p className="mb-5 rounded-xl border border-sage-200 bg-sage-50 px-4 py-3 text-[0.75rem] text-sage-700">
        ممنون از شما! نظرتان ثبت شد و پس از بررسی نمایش داده می‌شود.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-soft bg-white px-4 py-3">
        <p className="text-[0.75rem] text-ink-500">این محصول را خریده‌اید؟ تجربه‌تان را با دیگران به اشتراک بگذارید.</p>
        {user ? (
          <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-ink-900 px-4 py-2 text-[0.75rem] text-cream-50 hover:bg-ink-800">
            نوشتن نظر
          </button>
        ) : (
          <a href="/account?next=reviews" className="rounded-full border border-line px-4 py-2 text-[0.75rem] text-ink-700 hover:border-sage-400">
            برای ثبت نظر وارد شوید
          </a>
        )}
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 10) {
      notify('متن نظر باید حداقل ۱۰ حرف باشد.', 'error');
      return;
    }
    setSending(true);
    const res = await api('/api/reviews', { productId, rating, body: body.trim() });
    setSending(false);
    if (res.ok) setDone(true);
    else notify(res.message ?? 'ثبت نظر ناموفق بود.', 'error');
  };

  return (
    <form onSubmit={submit} className="mb-5 rounded-xl border border-line-soft bg-white p-4">
      <p className="text-[0.8125rem] font-medium text-ink-900">امتیاز شما</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="امتیاز">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            onClick={() => setRating(n)}
            className={cn(
              'h-9 min-w-9 rounded-lg border px-2 text-[0.75rem] transition-colors',
              rating >= n ? 'border-sage-400 bg-sage-100 text-sage-700' : 'border-line bg-white text-ink-400',
            )}
          >
            {num(n)}★
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="از جنس، سایز و کیفیت بنویسید…"
        className="mt-3 w-full rounded-xl border border-line bg-cream-100/60 p-3 text-[0.8125rem] leading-7 outline-none focus:border-sage-400 focus:bg-white"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-[0.75rem] text-ink-500 hover:bg-cream-200">
          انصراف
        </button>
        <button disabled={sending} className="rounded-full bg-ink-900 px-5 py-2 text-[0.75rem] text-cream-50 hover:bg-ink-800 disabled:opacity-60">
          {sending ? 'در حال ارسال…' : 'ثبت نظر'}
        </button>
      </div>
    </form>
  );
}
