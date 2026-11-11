'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { blurOf } from '@/lib/images';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
    const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 26, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.95, delay, ease: EASE },
  });

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream-100">
      {/* soft ambient washes */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -start-24 top-10 size-[26rem] rounded-full bg-sage-100/70 blur-[90px]" />
        <span className="absolute -end-20 bottom-0 size-[22rem] rounded-full bg-blush-100/80 blur-[80px]" />
      </div>

      <div className="container-x relative">
        <div className="grid items-center gap-8 pb-10 pt-8 sm:gap-10 sm:pb-16 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-20 lg:pt-16">
          {/* copy */}
          <div className="order-1 lg:order-1">
            <motion.div {...rise(0.05)} className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-cream-50/80 px-3 py-1.5">
              <Sparkles className="size-3 text-sage-600" strokeWidth={1.8} />
              <span className="text-[0.6875rem] text-sage-700">کالکشن پاییز و زمستان ۱۴۰۵</span>
            </motion.div>

            <motion.h1
              {...rise(0.14)}
              className="mt-5 text-[2rem] font-semibold leading-[1.32] text-ink-900 sm:text-[2.6rem] lg:text-[3.1rem]"
            >
              لطافت، در هر قدم
              <span className="mt-1 block text-[1.5rem] font-normal leading-[1.5] text-ink-500 sm:text-[1.9rem]">
                و آرامش، در هر جزئیات
              </span>
            </motion.h1>

            <motion.p {...rise(0.22)} className="prose-fa mt-4 max-w-[42ch] text-[0.875rem] sm:text-[0.9375rem]">
              جوراب، جوراب‌شلواری، اکسسوری مو و پوشاک زیرهٔ زنانه، مردانه و کودکان — با الیاف نخی نرم، رنگ‌های آرام و دوختی که
              سال‌ها همراه شما می‌ماند.
            </motion.p>

            <motion.div {...rise(0.3)} className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                href="/shop"
                className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-ink-900 px-7 text-[0.9375rem] font-medium text-cream-50 shadow-[0_14px_30px_-18px_rgba(48,44,41,.7)] transition-all duration-400 ease-silk hover:bg-ink-800 hover:shadow-[0_20px_38px_-18px_rgba(48,44,41,.55)] active:scale-[0.99]"
              >
                خرید از کالکشن
                <ArrowLeft className="size-4 transition-transform duration-400 ease-silk group-hover:-translate-x-1" strokeWidth={1.8} />
              </Link>
              <Link
                href="/shop/tights"
                className="inline-flex h-[52px] items-center justify-center rounded-2xl border border-line bg-cream-50/60 px-7 text-[0.9375rem] text-ink-800 backdrop-blur-sm transition-all duration-400 ease-silk hover:border-sage-400 hover:bg-cream-50"
              >
                جوراب‌شلواری‌های تازه
              </Link>
            </motion.div>

            <motion.dl {...rise(0.4)} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line/70 pt-6">
              {[
                { k: '۱۸٬۰۰۰+', v: 'سفارش موفق' },
                { k: '۴٫۹ از ۵', v: 'رضایت مشتریان' },
                { k: '۷ روز', v: 'بازگشت آسان' },
              ].map((s) => (
                <div key={s.v} className="flex items-baseline gap-1.5">
                  <dt className="text-[0.9375rem] font-semibold text-ink-900">{s.k}</dt>
                  <dd className="text-[0.6875rem] text-ink-400">{s.v}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* imagery */}
          <motion.div
            className="order-2 lg:order-2"
            initial={{opacity: 0, scale: 1.03}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE }}
            style={{ opacity: fade }}
          >
            <div className="relative">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden rounded-[28px] bg-cream-200 shadow-[0_30px_70px_-40px_rgba(58,50,44,.45)] sm:rounded-[36px]">
                <motion.div className="absolute inset-0" style={{ y: imgY }}>
                  <Image
                    src="/images/hero.webp"
                    alt="ست کرم و جوراب‌شلواری نود الاردشاپ روی پایهٔ سنگی با روبان سبز مریم‌گلی"
                    fill
                    priority
                    sizes="(max-width: 1024px) 92vw, 46vw"
                    placeholder="blur"
                    blurDataURL={blurOf('hero')}
                    className="scale-105 object-cover"
                  />
                </motion.div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/12 via-transparent to-transparent" />
              </div>

              {/* floating detail card */}
              <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
                className="absolute -bottom-4 start-2 flex items-center gap-3 rounded-2xl border border-white/60 bg-cream-50/92 p-2.5 pe-4 shadow-float backdrop-blur-md sm:start-4 lg:-bottom-6"
              >
                <div className="relative size-14 overflow-hidden rounded-xl bg-cream-200">
                  <Image src="/images/sock-ankle__cream.webp" alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <p className="text-[0.75rem] font-medium text-ink-900">جوراب ساق کوتاه پنبهٔ مصری</p>
                  <p className="mt-0.5 text-[0.625rem] text-ink-400">۵ رنگ · از ۸۹٬۰۰۰ تومان</p>
                </div>
                <Link
                  href="/product/saq-kootah-penbe-masri"
                  aria-label="مشاهدهٔ جوراب ساق کوتاه"
                  className="ms-1 flex size-8 items-center justify-center rounded-full bg-ink-900 text-cream-50 transition-transform duration-300 hover:scale-105"
                >
                  <ArrowLeft className="size-3.5" strokeWidth={2} />
                </Link>
              </motion.div>

              {/* soft sage accent block */}
              <div aria-hidden className="absolute -end-3 -top-3 hidden size-20 rounded-3xl border border-sage-200/80 bg-sage-100/50 backdrop-blur-sm sm:block" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
