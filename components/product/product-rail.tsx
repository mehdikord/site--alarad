'use client';

import * as React from 'react';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import type { ProductCardData } from '@/lib/card';
import { cn } from '@/lib/utils';

/**
 * Mobile: snap-scrolling rail with a peek of the next card.
 * Desktop: calm 4-up grid. Same markup, so no layout shift when resizing.
 */
export function ProductRail({
  products,
  priorityCount = 0,
  className,
}: {
  products: ProductCardData[];
  priorityCount?: number;
  className?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const amount = (card?.offsetWidth ?? 260) + 12;
    el.scrollBy({ left: dir * amount * -1, behavior: 'smooth' }); // RTL: positive dir moves visually right
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={railRef}
        className="rail no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
      >
        {products.map((p, i) => (
          <div
            key={p.slug}
            data-card
            className="w-[64%] max-w-[280px] shrink-0 xs:w-[58%] sm:w-auto sm:max-w-none"
          >
            <ProductCard product={p} index={i} priority={i < priorityCount} />
          </div>
        ))}
      </div>

      {/* desktop arrows */}
      {products.length > 4 && (
        <div className="mt-5 hidden justify-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="قبلی"
            className="flex size-9 items-center justify-center rounded-full border border-line text-ink-500 transition-colors hover:border-sage-400 hover:text-ink-900"
          >
            <ChevronRight className="size-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="بعدی"
            className="flex size-9 items-center justify-center rounded-full border border-line text-ink-500 transition-colors hover:border-sage-400 hover:text-ink-900"
          >
            <ChevronLeft className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  );
}
