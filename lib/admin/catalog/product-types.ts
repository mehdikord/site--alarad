/** Client-safe shapes shared by the product editor and its server action. */
export type Audience = 'women' | 'men' | 'kids' | 'unisex';
export type ProductStatusKey = 'draft' | 'active' | 'archived';

export interface VariantPayload {
  id?: number | null;
  colorId: number | null;
  sizeId: number | null;
  sku: string;
  stock: number;
  price: number | null;
  isActive: boolean;
}

export interface ImagePayload {
  mediaId: number;
  colorId: number | null;
  /** UI only */
  url?: string;
}

export interface ProductPayload {
  id?: number | null;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  categoryId: number | null;
  audience: Audience;
  status: ProductStatusKey;
  isFeatured: boolean;
  price: number;
  compareAtPrice: number | null;
  material: string;
  care: string;
  origin: string;
  highlights: string[];
  tagIds: number[];
  metaTitle: string;
  metaDescription: string;
  variants: VariantPayload[];
  images: ImagePayload[];
}

export interface SaveProductResult {
  ok: boolean;
  message: string;
  id?: number;
  errors?: Record<string, string>;
}

export interface EditorOptions {
  categories: { id: number; name: string; depth: number; isActive: boolean }[];
  colors: { id: number; key: string; name: string; hex: string; swatch: string | null }[];
  sizes: { id: number; sizeGroup: string; key: string; label: string }[];
  tags: { id: number; name: string; slug: string }[];
}

export const AUDIENCE_LABEL: Record<Audience, string> = {
  women: 'زنانه',
  men: 'مردانه',
  kids: 'کودکان',
  unisex: 'زنانه و مردانه',
};

export const STATUS_LABEL: Record<ProductStatusKey, { label: string; tone: string }> = {
  draft: { label: 'پیش‌نویس', tone: 'bg-cream-200 text-ink-600' },
  active: { label: 'منتشر شده', tone: 'bg-sage-100 text-sage-700' },
  archived: { label: 'بایگانی', tone: 'bg-cream-300 text-ink-500' },
};
