import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Hero } from '@/components/home/hero';
import { CategoryGrid } from '@/components/home/category-grid';
import { EditorialBanner } from '@/components/home/editorial-banner';
import { Reviews, TrustStrip, LookbookStrip } from '@/components/home/reviews';
import { ProductRail } from '@/components/product/product-rail';
import { ProductCard } from '@/components/product/product-card';
import { SectionHeader } from '@/components/ui/misc';
import { toCardData } from '@/lib/card';
import { newArrivals, bestSellers, recommendations } from '@/lib/data/products';
import { Reveal } from '@/components/motion/reveal';

export default function HomePage() {
  const newest = newArrivals(8).map((p) => toCardData(p));
  const best = bestSellers(4).map((p) => toCardData(p));
  const picks = recommendations(4).map((p) => toCardData(p));

  return (
    <>
      <Hero />
      <TrustStrip />

      <CategoryGrid />

      <section className="container-x pb-6 pt-2 sm:pb-10" aria-labelledby="new-heading">
        <SectionHeader
          eyebrow="تازه رسیده‌ها"
          title="جدیدترین‌های الاردشاپ"
          description="هر هفته چند قلم تازه، در تعداد محدود — با همان زبان آرام همیشگی."
          action={
            <Link
              href="/shop?sort=newest"
              className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[0.75rem] text-ink-600 transition-colors hover:border-sage-400 hover:text-sage-700"
            >
              همهٔ تازه‌ها
              <ArrowLeft className="size-3.5 transition-transform duration-400 ease-silk group-hover:-translate-x-1" strokeWidth={2} />
            </Link>
          }
        />
        <ProductRail products={newest} priorityCount={2} />
      </section>

      <EditorialBanner />

      <section className="container-x py-14 sm:py-20" aria-labelledby="best-heading">
        <SectionHeader
          eyebrow="محبوب‌ترین‌ها"
          title="پرفروش‌ترین‌های این ماه"
          description="انتخاب‌هایی که بیشترین بار سفارش داده شده‌اند و کمترین بازگشت را داشته‌اند."
          action={
            <Link
              href="/shop?sort=popular"
              className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[0.75rem] text-ink-600 transition-colors hover:border-sage-400 hover:text-sage-700"
            >
              همهٔ پرفروش‌ها
              <ArrowLeft className="size-3.5 transition-transform duration-400 ease-silk group-hover:-translate-x-1" strokeWidth={2} />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-9 lg:grid-cols-4">
          {best.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      <section className="bg-sage-50/70 py-14 sm:py-20" aria-labelledby="picks-heading">
        <div className="container-x">
          <SectionHeader
            eyebrow="پیشنهاد ویژهٔ الاردشاپ"
            title="اگر شک دارید، از این‌ها شروع کنید"
            description="چهار قلم با بالاترین رضایت مشتری؛ انتخاب‌های امن برای خرید اول."
            align="center"
          />
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-9 lg:grid-cols-4">
            {picks.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <LookbookStrip />
      <Reviews />
      <ClosingInvite />
    </>
  );
}

function ClosingInvite() {
  return (
    <section className="container-x pb-16 sm:pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-sage-200/70 bg-gradient-to-bl from-cream-100 via-cream-50 to-sage-50 px-6 py-12 text-center sm:px-12 sm:py-16">
          <span aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-sage-100/60 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -start-10 bottom-0 size-48 rounded-full bg-blush-100/70 blur-3xl" />
          <p className="eyebrow mx-auto mb-3 justify-center">خرید بدون ریسک</p>
          <h2 className="mx-auto max-w-[24ch] text-h2 text-ink-900 sm:text-[1.75rem]">
            اول لمس کنید، بعد تصمیم بگیرید
          </h2>
          <p className="prose-fa mx-auto mt-3 max-w-[46ch] text-[0.8125rem] sm:text-sm">
            اگر رنگ یا سایز مطابق سلیقه‌تان نبود، تا ۷ روز بدون پرسش بازگردانید. هزینهٔ ارسال بازگشت با ماست.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink-900 px-6 text-[0.875rem] font-medium text-cream-50 transition-colors duration-300 hover:bg-ink-800"
            >
              شروع خرید
              <ArrowLeft className="size-4" strokeWidth={2} />
            </Link>
            <Link
              href="/help"
              className="inline-flex h-12 items-center rounded-xl border border-line bg-cream-50/70 px-6 text-[0.875rem] text-ink-800 transition-colors duration-300 hover:border-sage-400"
            >
              راهنمای سایزبندی
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
