'use client';

import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeader, Stars } from '@/components/ui/misc';

const REVIEWS = [
  {
    name: 'نگار ک.',
    city: 'تهران',
    rating: 5,
    body: 'جوراب‌شلواری ۲۰ دنیر واقعاً هم‌رنگ پوستم بود، نه نارنجی نه خاکستری. کمرش هم زیر لباس تنگ دیده نمی‌شود. سه تا هم برای خواهرم گرفتم.',
    item: 'جوراب‌شلواری شفاف ۲۰ دنیر',
  },
  {
    name: 'مریم ص.',
    city: 'اصفهان',
    rating: 5,
    body: 'اسکرانچی ابریشم بعد از دو ماه شست‌وشو هنوز فرمش را از دست نداده. لطیف است و روی مو خط نمی‌گذارد — چیزی که دنبالش بودم.',
    item: 'اسکرانچی ابریشم درشت',
  },
  {
    name: 'سحر ر.',
    city: 'شیراز',
    rating: 5,
    body: 'شورت بی‌درز را برای روزهای کاری خریدم؛ زیر شلوار خط نمی‌اندازد و اصلاً حس نمی‌شود. بسته‌بندی هم خیلی مرتب و تمیز بود.',
    item: 'شورت پنبهٔ ارگانیک بی‌درز',
  },
];

export function Reviews() {
    return (
    <section className="container-x py-14 sm:py-20">
      <SectionHeader
        eyebrow="از مشتریان ما"
        title="آرامش، برای ۱۸٬۰۰۰ نفر"
        description="نظرات تأییدشدهٔ خریداران الاردشاپ — بدون ویرایش و بازنویسی."
        align="center"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <motion.figure
            key={r.name}
            initial={{opacity: 0, y: 20}}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col rounded-lg border border-line-soft bg-white p-5 shadow-soft sm:p-6"
          >
            <Stars rating={r.rating} size={13} />
            <blockquote className="mt-3 flex-1 text-[0.8125rem] leading-[2] text-ink-700">«{r.body}»</blockquote>
            <figcaption className="mt-4 border-t border-line-soft pt-3">
              <p className="text-[0.75rem] font-medium text-ink-900">
                {r.name} <span className="font-normal text-ink-300">— {r.city}</span>
              </p>
              <p className="mt-0.5 text-[0.625rem] text-ink-300">{r.item}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

export function TrustStrip() {
  const items = [
    { title: 'الیاف طبیعی', body: 'پنبه، کتان، ابریشم', icon: 'leaf' },
    { title: 'ارسال سریع', body: '۲ تا ۴ روز کاری', icon: 'truck' },
    { title: 'بازگشت آسان', body: 'تا ۷ روز، بدون پرسش', icon: 'refresh' },
    { title: 'پرداخت امن', body: 'درگاه بانکی معتبر', icon: 'shield' },
  ];
  return (
    <section className="border-y border-line-soft bg-cream-100/60">
      <div className="container-x grid grid-cols-2 gap-y-6 py-6 sm:grid-cols-4 sm:py-7">
        {items.map((it) => (
          <div key={it.title} className="flex items-center justify-center gap-3 sm:justify-start sm:ps-4">
            <span className="flex size-9 items-center justify-center rounded-full bg-cream-200 text-sage-600">
              <TrustIcon name={it.icon} />
            </span>
            <div>
              <p className="text-[0.75rem] font-medium text-ink-900">{it.title}</p>
              <p className="text-[0.625rem] text-ink-400">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustIcon({ name }: { name: string }) {
  const common = { className: 'size-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 } as const;
  if (name === 'leaf')
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <path d="M20 4C10 4 4 9 4 16c0 2 1 4 1 4s6-1 9-4 6-8 6-12Z" strokeLinejoin="round" />
        <path d="M5 20c1-5 5-9 10-11" strokeLinecap="round" />
      </svg>
    );
  if (name === 'truck')
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <path d="M3 7h10v9H3zM13 11h4l4 3v2h-8z" strokeLinejoin="round" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    );
  if (name === 'refresh')
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <path d="M20 12a8 8 0 1 1-2.6-5.9" strokeLinecap="round" />
        <path d="M20 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...common} aria-hidden>
      <path d="M12 3l7 3v6c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6l7-3Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LookbookStrip() {
  const shots = [
    { key: 'story-folded', label: 'ست‌های کرم' },
    { key: 'story-tights', label: 'جوراب‌شلواری' },
    { key: 'story-hair', label: 'اکسسوری مو' },
    { key: 'story-socks', label: 'جوراب نخی' },
    { key: 'story-briefs', label: 'پنبهٔ نرم' },
  ];
  return (
    <section className="py-14 sm:py-20">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <p className="eyebrow mb-2.5">لوک‌بوک</p>
            <h2 className="text-h2 sm:text-h1 text-ink-900">آرامش در قاب‌های کوچک</h2>
            <p className="mt-2 max-w-lg text-[0.8125rem] leading-[1.9] text-ink-500">
              رنگ‌های هم‌خانواده، بافت‌های لطیف و جزئیاتی که با هم یک زبان واحد می‌سازند.
            </p>
          </div>
        </Reveal>
      </div>
      <div className="rail no-scrollbar mt-8 flex gap-2.5 overflow-x-auto px-4 pb-2 sm:justify-center sm:gap-3 sm:overflow-visible sm:px-6">
        {shots.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="group relative aspect-square w-[42%] max-w-[220px] shrink-0 overflow-hidden rounded-lg bg-cream-200 shadow-soft sm:w-[190px]"
          >
            <img
              src={`/images/${s.key}.webp`}
              alt={s.label}
              loading="lazy"
              className="size-full object-cover transition-transform duration-[900ms] ease-silk group-hover:scale-[1.07]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="absolute inset-x-0 bottom-0 p-3 text-[0.6875rem] text-cream-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
