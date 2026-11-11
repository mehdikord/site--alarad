'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { Stars } from '@/components/ui/misc';
import { num } from '@/lib/format';
import type { Review } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ReviewsBlock({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: Review[];
  rating: number;
  reviewCount: number;
}) {
    const dist = [0.78, 0.16, 0.04, 0.01, 0.01]; // 5→1 stars

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
              <p className="mt-1.5 text-[0.625rem] text-ink-300">{r.date}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
