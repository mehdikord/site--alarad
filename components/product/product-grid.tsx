'use client';

import { ProductCard } from '@/components/product/product-card';
import type { ProductCardData } from '@/lib/card';
import { cn } from '@/lib/utils';

export function ProductGrid({
  products,
  className,
  priorityCount = 0,
  columns = 4,
}: {
  products: ProductCardData[];
  className?: string;
  priorityCount?: number;
  columns?: 3 | 4;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-9',
        columns === 4 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3',
        className,
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={`${p.slug}-${i}`} product={p} index={i % 8} priority={i < priorityCount} />
      ))}
    </div>
  );
}
