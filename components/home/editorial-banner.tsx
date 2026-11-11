'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { blurOf } from '@/lib/images';

export function EditorialBanner() {
    return (
    <section className="container-x py-4 sm:py-8">
      <motion.div
        initial={{opacity: 0, y: 24}}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-xl bg-cream-200 sm:rounded-2xl"
      >
        <div className="grid items-center lg:grid-cols-[1.1fr_1fr]">
          <div className="relative order-2 lg:order-1">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="eyebrow mb-3">کالکشن زمستان</p>
              <h2 className="max-w-[20ch] text-h2 text-ink-900 sm:text-[1.75rem] sm:leading-[1.35]">
                گرما، بدون ضخامت. بافت مخملی و پشم مرینوس.
              </h2>
              <p className="prose-fa mt-3 max-w-[40ch] text-[0.8125rem] sm:text-sm">
                مجموعه‌ای از جوراب‌های بافت و جوراب‌شلواری‌های گرم که زیر لباس دیده نمی‌شوند، اما سرمای زمستان را حس نمی‌کنید.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link
                  href="/shop?tag=winter"
                  className="group inline-flex h-11 items-center gap-2 rounded-xl bg-ink-900 px-5 text-[0.8125rem] font-medium text-cream-50 transition-colors duration-300 hover:bg-ink-800"
                >
                  مجموعهٔ گرم
                  <ArrowLeft className="size-3.5 transition-transform duration-400 ease-silk group-hover:-translate-x-1" strokeWidth={2} />
                </Link>
                <Link
                  href="/shop/tights"
                  className="inline-flex h-11 items-center rounded-xl border border-line bg-cream-50/70 px-5 text-[0.8125rem] text-ink-800 transition-colors duration-300 hover:border-sage-400 hover:bg-cream-50"
                >
                  جوراب‌شلواری گرم
                </Link>
              </div>
            </div>
          </div>
          <div className="relative order-1 aspect-[16/11] w-full overflow-hidden lg:order-2 lg:aspect-auto lg:h-full lg:min-h-[380px]">
            <Image
              src="/images/editorial-wide.webp"
              alt="بافت کرم و جوراب‌شلواری نود با روبان سبز"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={blurOf('editorial-wide')}
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent to-cream-200/70 lg:to-cream-200/40" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
