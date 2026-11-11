'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck, RotateCcw } from 'lucide-react';
import type { Product } from '@/lib/types';
import { colorOf, sizeLabel, sizeNote } from '@/lib/data/taxonomy';
import { gallery } from '@/lib/images';
import { money, num, toman } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCart, makeCartItem, useUi } from '@/lib/store';
import { Gallery } from '@/components/product/gallery';
import { Accordion, QuantityStepper, Stars } from '@/components/ui/misc';
import { Badge, StockBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ProductDetailProps {
  product: Product;
  /** colorStock[color][size] = stock */
  stockMatrix: Record<string, Record<string, number>>;
  categoryName: string;
}

export function ProductDetail({ product, stockMatrix, categoryName }: ProductDetailProps) {
    const add = useCart((s) => s.add);
  const notify = useUi((s) => s.notify);

  const firstAvailableColor =
    product.colors.find((c) => Object.values(stockMatrix[c] ?? {}).some((n) => n > 0)) ?? product.colors[0];
  const [color, setColor] = React.useState(firstAvailableColor);
  const [size, setSize] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(1);
  const [wish, setWish] = React.useState(false);
  const [flash, setFlash] = React.useState(false);

  const sizesForColor = stockMatrix[color] ?? {};
  const availableSizes = product.sizes.filter((s) => (sizesForColor[s] ?? 0) > 0);

  // keep a valid size selected when the colour changes
  React.useEffect(() => {
    setSize((prev) => (prev && (sizesForColor[prev] ?? 0) > 0 ? prev : availableSizes[0] ?? null));
    setQty(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  const stock = size ? sizesForColor[size] ?? 0 : 0;
  const totalStock = Object.values(stockMatrix).reduce(
    (sum, sizes) => sum + Object.values(sizes).reduce((a, b) => a + b, 0),
    0,
  );
  const soldOut = totalStock <= 0;
  const low = !soldOut && stock > 0 && stock <= 5;
  const images = gallery(product.shots, color);
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;

  const handleAdd = () => {
    if (!size || stock <= 0) {
      notify('لطفاً رنگ و سایز موجود را انتخاب کنید.', 'error');
      return;
    }
    add(makeCartItem(product, color, size, qty, stock));
    notify('به سبد خرید اضافه شد.', 'success');
    setFlash(true);
    setTimeout(() => setFlash(false), 1600);
  };

  return (
    <>
      <div className="grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Gallery images={images} alt={product.name} />
          <div className="mt-3 hidden items-center justify-center gap-6 text-[0.6875rem] text-ink-400 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="size-3.5 text-sage-600" strokeWidth={1.7} />
              ارسال ۲ تا ۴ روز کاری
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RotateCcw className="size-3.5 text-sage-600" strokeWidth={1.7} />
              بازگشت تا ۷ روز
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-sage-600" strokeWidth={1.7} />
              ضمانت اصالت
            </span>
          </div>
        </div>

        <div>
          {/* header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link
                href={`/shop/${product.category}`}
                className="text-[0.6875rem] text-sage-700 transition-colors hover:text-sage-600"
              >
                {categoryName}
              </Link>
              <h1 className="mt-1.5 text-[1.375rem] font-semibold leading-[1.45] text-ink-900 sm:text-[1.75rem]">
                {product.name}
              </h1>
              <p className="mt-1 text-[0.8125rem] text-ink-400">{product.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setWish((w) => !w)}
              aria-pressed={wish}
              aria-label="افزودن به علاقه‌مندی‌ها"
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                wish ? 'border-blush-300 bg-blush-100 text-blush-500' : 'border-line text-ink-400 hover:border-sage-300',
              )}
            >
              <Heart className={cn('size-4', wish && 'fill-current')} strokeWidth={1.7} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-3 flex items-center gap-2 text-[0.75rem] text-ink-500 transition-colors hover:text-ink-900"
          >
            <Stars rating={product.rating} size={14} />
            <span className="font-medium text-ink-800">{num(product.rating)}</span>
            <span className="text-ink-300">({num(product.reviewCount)} نظر)</span>
          </button>

          {/* price */}
          <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
            <span className="text-[1.375rem] font-semibold text-ink-900 sm:text-2xl">
              {money(product.price)}
              <span className="ms-1.5 text-[0.75rem] font-normal text-ink-400">تومان</span>
            </span>
            {discount > 0 && (
              <>
                <span className="text-[0.8125rem] text-ink-300 line-through">{money(product.compareAtPrice!)}</span>
                <Badge tone="sage">{num(discount)}٪ تخفیف</Badge>
              </>
            )}
          </div>

          {/* highlights */}
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-center gap-1 rounded-full bg-cream-200/80 px-2.5 py-1 text-[0.6875rem] text-ink-600">
                <Check className="size-2.5 text-sage-600" strokeWidth={3} />
                {h}
              </li>
            ))}
          </ul>

          <div className="my-5 h-px bg-line-soft" />

          {/* colour */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-ink-900">
                رنگ: <span className="font-normal text-ink-500">{colorOf(color).name}</span>
              </p>
              <span className="text-[0.6875rem] text-ink-300">{num(product.colors.length)} رنگ</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const co = colorOf(c);
                const colStock = Object.values(stockMatrix[c] ?? {}).reduce((a, b) => a + b, 0);
                const active = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-pressed={active}
                    aria-label={`رنگ ${co.name}${colStock === 0 ? ' — ناموجود' : ''}`}
                    className={cn(
                      'relative flex size-10 items-center justify-center rounded-full transition-all duration-300 ease-silk',
                      active ? 'ring-1 ring-ink-900 ring-offset-[3px] ring-offset-cream-50' : 'hover:scale-105',
                      colStock === 0 && 'opacity-45',
                    )}
                  >
                    <span
                      className="size-7 rounded-full border border-white/80 shadow-[0_1px_3px_rgba(58,50,44,.2)]"
                      style={{ backgroundImage: co.swatch }}
                    />
                    {colStock === 0 && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-px w-7 rotate-45 bg-ink-500/70" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* size */}
          <div className="mt-5">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-ink-900">سایز</p>
              <Link href="/help#sizes" className="text-[0.6875rem] text-sage-700 underline decoration-sage-300 underline-offset-4">
                راهنمای سایز
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const n = sizesForColor[s] ?? 0;
                const active = size === s;
                const out = n <= 0;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => !out && setSize(s)}
                    disabled={out}
                    aria-pressed={active}
                    title={out ? 'این سایز در این رنگ ناموجود است' : sizeNote(s)}
                    className={cn(
                      'relative h-11 min-w-[64px] rounded-xl border px-4 text-[0.8125rem] transition-all duration-300 ease-silk',
                      active
                        ? 'border-ink-900 bg-ink-900 text-cream-50'
                        : out
                          ? 'cursor-not-allowed border-line-soft bg-cream-100 text-ink-300'
                          : 'border-line bg-white text-ink-700 hover:border-sage-400',
                    )}
                  >
                    {sizeLabel(s)}
                    {out && <span className="absolute inset-x-2 top-1/2 h-px bg-ink-200" aria-hidden />}
                  </button>
                );
              })}
            </div>
            {size && sizeNote(size) && <p className="mt-2 text-[0.6875rem] text-ink-400">{sizeNote(size)}</p>}
          </div>

          {/* stock state */}
          <div className="mt-4 flex min-h-6 items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${color}-${size}-${stock}`}
                initial={{opacity: 0, y: 4}}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2"
              >
                {soldOut ? (
                  <p className="text-[0.75rem] text-ink-400">این محصول فعلاً موجود نیست — به‌زودی شارژ می‌شود.</p>
                ) : low ? (
                  <p className="flex items-center gap-1.5 text-[0.75rem] text-blush-500">
                    <span className="size-1.5 animate-pulse rounded-full bg-blush-500" />
                    تنها {num(stock)} عدد در انبار — پیش از پایان موجودی ثبت کنید
                  </p>
                ) : stock > 0 ? (
                  <p className="flex items-center gap-1.5 text-[0.75rem] text-sage-700">
                    <Check className="size-3.5" strokeWidth={2.4} />
                    موجود در انبار — آمادهٔ ارسال
                  </p>
                ) : (
                  <p className="text-[0.75rem] text-ink-400">این ترکیب رنگ و سایز ناموجود است.</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* desktop CTA */}
          <div className="mt-5 hidden items-center gap-2.5 sm:flex">
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(stock, 1)} />
            <Button
              onClick={handleAdd}
              disabled={soldOut || stock <= 0}
              size="lg"
              className="flex-1"
              variant={flash ? 'sage' : 'primary'}
            >
              {flash ? (
                <>
                  <Check className="size-4" strokeWidth={2.4} />
                  به سبد اضافه شد
                </>
              ) : soldOut ? (
                'ناموجود'
              ) : (
                <>
                  <ShoppingBag className="size-4" strokeWidth={1.8} />
                  افزودن به سبد خرید
                </>
              )}
            </Button>
          </div>

          <p className="mt-3 hidden text-[0.6875rem] leading-relaxed text-ink-400 sm:block">
            ارسال رایگان برای سفارش‌های بالای {toman(500000)} · پرداخت درگاه امن · بازگشت ۷ روزه بدون پرسش
          </p>

          {/* details */}
          <div className="mt-6 border-t border-line-soft">
            <Accordion title="توضیحات محصول" defaultOpen>
              <div className="space-y-3">
                {product.description.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Accordion>
            <Accordion title="جنس و مراقبت">
              <dl className="space-y-2.5">
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-ink-400">الیاف</dt>
                  <dd className="text-ink-700">{product.details.material}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-ink-400">مراقبت</dt>
                  <dd className="text-ink-700">{product.details.care}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-ink-400">تولید</dt>
                  <dd className="text-ink-700">{product.details.origin}</dd>
                </div>
              </dl>
            </Accordion>
            <Accordion title="ارسال و بازگشت">
              <ul className="space-y-2">
                <li>ارسال با پست پیشتاز: ۲ تا ۴ روز کاری — ۴۹٬۰۰۰ تومان (رایگان بالای ۵۰۰٬۰۰۰ تومان).</li>
                <li>ارسال سریع تهران و کرج: همان روز برای سفارش‌های تا ساعت ۱۲.</li>
                <li>بازگشت یا تعویض تا ۷ روز پس از دریافت، در صورت باز نشدن بسته‌بندی بهداشتی.</li>
                <li>کد رهگیری مرسوله پس از ارسال در بخش «سفارش‌های من» نمایش داده می‌شود.</li>
              </ul>
            </Accordion>
            <Accordion title="سایزبندی و انتخاب درست">
              <p className="mb-2">{product.sizes.map((s) => `${sizeLabel(s)}${sizeNote(s) ? ` — ${sizeNote(s)}` : ''}`).join(' · ')}</p>
              <p>اگر بین دو سایز هستید، سایز بزرگ‌تر را انتخاب کنید؛ کشباف الاردشاپ بعد از چند شست‌وشو جمع نمی‌شود.</p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* sticky mobile CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-cream-50/95 px-3 py-2.5 backdrop-blur-xl sm:hidden"
        style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.6875rem] text-ink-400">
              {colorOf(color).name}
              {size ? ` · سایز ${sizeLabel(size)}` : ''}
            </p>
            <p className="text-[0.9375rem] font-semibold text-ink-900">
              {money(product.price * qty)}
              <span className="ms-1 text-[0.625rem] font-normal text-ink-400">تومان</span>
            </p>
          </div>
          <Button onClick={handleAdd} disabled={soldOut || stock <= 0} size="md" variant={flash ? 'sage' : 'primary'} className="min-w-[9.5rem]">
            {flash ? (
              <>
                <Check className="size-4" strokeWidth={2.4} /> اضافه شد
              </>
            ) : soldOut ? (
              'ناموجود'
            ) : (
              <>
                <ShoppingBag className="size-4" strokeWidth={1.8} /> افزودن به سبد
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

export function StickyBuyBarSpacer() {
  return <div className="h-20 sm:hidden" aria-hidden />;
}

export { StockBadge, Minus, Plus };
