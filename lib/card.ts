import type { ColorOption, Product, ProductImage } from '@/lib/types';

export interface CardImage {
  src: string;
  blur: string;
}

export interface ProductCardData {
  slug: string;
  name: string;
  subtitle?: string;
  price: number;
  compareAtPrice?: number;
  colors: string[];
  /** size labels (display only) */
  sizeLabels: string[];
  /** first two photos per colour key ('' = colour-less fallback) */
  images: Record<string, CardImage[]>;
  palette: Record<string, ColorOption>;
  tags?: string[];
  /** stock per colour, used to grey-out unavailable swatches */
  colorStock?: Record<string, number>;
  totalStock: number;
  rating?: number;
  reviewCount?: number;
}

/** photos for a colour: colour-specific first, then shared photos, then anything */
export function imagesForColor(images: ProductImage[], color: string | null | undefined): ProductImage[] {
  const own = color ? images.filter((i) => i.color === color) : [];
  const shared = images.filter((i) => i.color === null);
  const list = [...own, ...shared];
  return list.length ? list : images;
}

export function toCardData(p: Product): ProductCardData {
  const colorStock: Record<string, number> = {};
  for (const c of p.colors) colorStock[c] = p.variants.filter((v) => v.color === c).reduce((s, v) => s + v.stock, 0);
  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);

  const images: Record<string, CardImage[]> = {};
  for (const c of p.colors.length ? p.colors : ['']) {
    images[c] = imagesForColor(p.images, c || null)
      .slice(0, 2)
      .map((i) => ({ src: i.src, blur: i.blur }));
  }
  if (!images['']) images[''] = imagesForColor(p.images, null).slice(0, 2).map((i) => ({ src: i.src, blur: i.blur }));

  const palette: Record<string, ColorOption> = {};
  for (const c of p.colors) if (p.palette[c]) palette[c] = p.palette[c];

  return {
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    colors: p.colors,
    sizeLabels: p.sizes.map((s) => p.sizeMeta[s]?.label ?? s),
    images,
    palette,
    tags: p.tags,
    colorStock,
    totalStock,
    rating: p.rating,
    reviewCount: p.reviewCount,
  };
}
