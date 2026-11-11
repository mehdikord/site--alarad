'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CATEGORIES } from '@/lib/data/categories';
import { blurOf } from '@/lib/images';
import { num } from '@/lib/format';
import { SectionHeader } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export function CategoryGrid() {
  
  return (
    <section className="container-x py-14 sm:py-20" aria-labelledby="categories-heading">
      <SectionHeader
        eyebrow="دسته‌بندی‌ها"
        title="از کجا شروع کنیم؟"
        description="چهار دستهٔ اصلی الاردشاپ؛ همه با یک زبان مشترک: الیاف طبیعی، رنگ‌های آرام و دوخت تمیز."
        action={
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 text-[0.8125rem] text-ink-600 transition-colors hover:text-sage-700"
          >
            همهٔ محصولات
            <ArrowLeft className="size-4 transition-transform duration-400 ease-silk group-hover:-translate-x-1" strokeWidth={1.8} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CATEGORIES.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{opacity: 0, y: 26, filter: 'blur(8px)'}}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={cn(i === 0 && 'lg:mt-0', i === 1 && 'lg:mt-8', i === 2 && 'lg:mt-2', i === 3 && 'lg:mt-10')}
          >
            <Link
              href={`/shop/${c.slug}`}
              className="group relative block overflow-hidden rounded-lg bg-cream-200 shadow-soft transition-all duration-500 ease-silk hover:shadow-lift"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={c.image}
                  alt={`دستهٔ ${c.name}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 24vw"
                  placeholder="blur"
                  blurDataURL={blurOf(c.image.replace('/images/', '').replace('.webp', ''))}
                  quality={82}
                  className="object-cover transition-transform duration-[900ms] ease-silk group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/55 via-ink-900/10 to-transparent transition-opacity duration-500 group-hover:from-ink-900/60" />

                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                  <p className="text-[0.5625rem] tracking-[0.18em] text-cream-200/90">{num(c.count)} محصول</p>
                  <h3 className="mt-1 text-[0.9375rem] font-semibold text-cream-50 sm:text-base">{c.name}</h3>
                  <p className="mt-0.5 text-[0.6875rem] text-cream-200/85">{c.tagline}</p>
                  <span className="mt-3 flex h-7 w-fit items-center gap-1.5 rounded-full bg-cream-50/92 px-3 text-[0.625rem] font-medium text-ink-900 opacity-0 transition-all duration-400 ease-silk group-hover:opacity-100 group-focus-visible:opacity-100 sm:translate-y-1 sm:group-hover:translate-y-0">
                    مشاهده
                    <ArrowLeft className="size-3" strokeWidth={2} />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
