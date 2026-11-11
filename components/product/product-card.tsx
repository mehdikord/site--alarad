'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { colorOf, sizeLabel } from '@/lib/data/taxonomy';
import { shot } from '@/lib/images';
import { money, num } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProductCardData } from '@/lib/card';
import { productCardImage } from '@/lib/images';
import { Badge } from '@/components/ui/badge';

export function ProductCard({
  product,
  priority = false,
  index = 0,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  index?: number;
  className?: string;
}) {
  const defaultColor = React.useMemo(() => {
    const order = ['cream', 'oat', 'blush', 'sage', 'rose', 'dove', 'navy', 'charcoal', 'black'];
    const inStock = product.colors.filter((c) => (product.colorStock?.[c] ?? 1) > 0);
    const pool = inStock.length ? inStock : product.colors;
    return [...pool].sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
  }, [product.colors, product.colorStock]);
  const [activeColor, setActiveColor] = React.useState(defaultColor);
  const [hovered, setHovered] = React.useState(false);
  
  const primary = shot(product.shots[0], activeColor);
  const secondary = shot(product.shots[1] ?? product.shots[0], activeColor);
  const stock = product.colorStock?.[activeColor] ?? product.totalStock;
  const soldOut = product.totalStock <= 0;
  const low = !soldOut && stock > 0 && stock <= 5;
  const activeName = colorOf(activeColor).name;

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;

  return (
    <motion.article
      className={cn('group relative', className)}
      initial={{opacity: 0, y: 22, filter: 'blur(6px)'}}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.62, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden rounded-lg bg-cream-200 shadow-soft transition-shadow duration-500 ease-silk group-hover:shadow-lift">
        <Link href={`/product/${product.slug}`} className="block" aria-label={product.name}>
          <div className="relative aspect-[4/5] w-full">
            <Image
              src={primary.src}
              alt={`${product.name} — ${activeName}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL={primary.blur}
              quality={82}
              priority={priority}
              className={cn(
                'object-cover transition-[transform,opacity] duration-700 ease-silk group-hover:scale-[1.045]',
                hovered && 'sm:opacity-0',
              )}
            />
            {(
              <Image
                src={secondary.src}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                placeholder="blur"
                blurDataURL={secondary.blur}
                quality={80}
                className={cn(
                  'hidden object-cover transition-[transform,opacity] duration-700 ease-silk sm:block',
                  hovered ? 'scale-[1.045] opacity-100' : 'scale-100 opacity-0',
                )}
              />
            )}
            {/* soft top gradient so badges stay readable on any photo */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-900/12 to-transparent opacity-70" />
          </div>
        </Link>

        {/* badges */}
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {soldOut ? (
              <Badge tone="cream">ناموجود</Badge>
            ) : product.tags?.includes('new') ? (
              <Badge tone="ink">جدید</Badge>
            ) : low ? (
              <Badge tone="blush" dot>
                تنها {num(stock)} عدد
              </Badge>
            ) : product.tags?.includes('bestseller') ? (
              <Badge tone="cream">پرفروش</Badge>
            ) : null}
          </div>
          {discount > 0 && (
            <span className="rounded-full bg-cream-50/95 px-2 py-1 text-[0.6875rem] font-medium text-sage-700 backdrop-blur-sm">
              −{num(discount)}٪
            </span>
          )}
        </div>

        {soldOut && (
          <div className="pointer-events-none absolute inset-0 bg-cream-50/45 backdrop-blur-[1px]" aria-hidden />
        )}

        {/* hover affordance — desktop only */}
        {!soldOut && (
          <div className="absolute inset-x-2.5 bottom-2.5 hidden sm:block">
            <motion.div
              initial={false}
              animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/product/${product.slug}`}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-cream-50/95 px-3 py-2.5 text-[0.75rem] font-medium text-ink-900 shadow-soft backdrop-blur-md transition-colors hover:bg-white"
              >
                مشاهده و انتخاب سایز
              </Link>
            </motion.div>
          </div>
        )}

        {/* mobile quick-view dot — 44px target without covering the photo */}
        <Link
          href={`/product/${product.slug}`}
          className="absolute bottom-2.5 end-2.5 flex size-9 items-center justify-center rounded-full bg-cream-50/92 text-ink-700 shadow-soft backdrop-blur-md transition-transform duration-300 active:scale-95 sm:hidden"
          aria-label="مشاهدهٔ جزئیات"
        >
          <Plus className="size-4" strokeWidth={1.8} />
        </Link>

        {/* colour swatches */}
        {product.colors.length > 1 && (
          <div className="absolute bottom-2.5 start-2.5 hidden items-center gap-1.5 rounded-full bg-cream-50/85 px-2 py-1.5 shadow-soft backdrop-blur-md transition-opacity duration-300 sm:flex">
            {product.colors.slice(0, 4).map((c) => {
              const co = colorOf(c);
              const out = (product.colorStock?.[c] ?? 1) <= 0;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveColor(c);
                  }}
                  aria-label={`رنگ ${co.name}`}
                  aria-pressed={activeColor === c}
                  className={cn(
                    'size-[15px] rounded-full border border-white/80 shadow-[0_1px_2px_rgba(58,50,44,.18)] transition-transform duration-300 hover:scale-110',
                    activeColor === c && 'ring-[1.5px] ring-ink-900/70 ring-offset-[2px] ring-offset-cream-50',
                    out && 'opacity-40',
                  )}
                  style={{ backgroundImage: co.swatch }}
                />
              );
            })}
            {product.colors.length > 4 && (
              <span className="text-[0.625rem] text-ink-500">+{num(product.colors.length - 4)}</span>
            )}
          </div>
        )}
      </div>

      {/* text block */}
      <div className="mt-3 px-0.5">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="line-clamp-2 text-[0.875rem] font-medium leading-[1.65] text-ink-900 transition-colors duration-300 group-hover:text-sage-700 sm:text-[0.9375rem]">
            {product.name}
          </h3>
        </Link>
        {product.subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-ink-400">{product.subtitle}</p>
        )}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[0.9375rem] font-semibold text-ink-900">
            {money(product.price)}
            <span className="ms-1 text-[0.6875rem] font-normal text-ink-400">تومان</span>
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-[0.6875rem] text-ink-300 line-through decoration-ink-200">
              {money(product.compareAtPrice)}
            </span>
          )}
        </div>
        {/* mobile: show active colour name so swatch interaction is explicit */}
        <p className="mt-1 flex items-center gap-1.5 text-[0.6875rem] text-ink-300 sm:hidden">
          <span className="size-2.5 rounded-full border border-white/80" style={{ backgroundImage: colorOf(activeColor).swatch }} />
          {activeName}
          <span className="text-cream-400">•</span>
          {num(product.colors.length)} رنگ
        </p>
        <div className="mt-1.5 hidden flex-wrap gap-1 sm:flex">
          {product.sizes.slice(0, 5).map((s) => (
            <span key={s} className="rounded-md bg-cream-200/70 px-1.5 py-0.5 text-[0.625rem] text-ink-400">
              {sizeLabel(s)}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
