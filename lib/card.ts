import type { Product } from '@/lib/types';

export interface ProductCardData {
  slug: string;
  name: string;
  subtitle?: string;
  price: number;
  compareAtPrice?: number;
  colors: string[];
  sizes: string[];
  shots: string[];
  tags?: string[];
  /** stock per colour, used to grey-out unavailable swatches */
  colorStock?: Record<string, number>;
  totalStock: number;
  rating?: number;
  reviewCount?: number;
}

export function toCardData(p: Product, stockMap?: Record<string, number>): ProductCardData {
  const colorStock: Record<string, number> = {};
  for (const c of p.colors) {
    colorStock[c] = p.variants
      .filter((v) => v.color === c)
      .reduce((s, v) => s + (stockMap?.[v.id] ?? v.stock), 0);
  }
  const totalStock = Object.values(colorStock).reduce((a, b) => a + b, 0);
  return {
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    colors: p.colors,
    sizes: p.sizes,
    shots: p.shots,
    tags: p.tags,
    colorStock,
    totalStock,
    rating: p.rating,
    reviewCount: p.reviewCount,
  };
}
