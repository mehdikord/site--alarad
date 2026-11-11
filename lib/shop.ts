import type { Product, CategorySlug, Audience } from '@/lib/types';
import { PRODUCTS, PRICE_BOUNDS } from '@/lib/data/products';
import { COLORS, colorOf, sizeLabel, ALL_SIZES } from '@/lib/data/taxonomy';
import { toLatinDigits } from '@/lib/format';

export type SortKey = 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'discount';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'پیشنهاد الاردشاپ' },
  { key: 'newest', label: 'جدیدترین' },
  { key: 'price-asc', label: 'ارزان‌ترین' },
  { key: 'price-desc', label: 'گران‌ترین' },
  { key: 'rating', label: 'بیشترین امتیاز' },
  { key: 'discount', label: 'بیشترین تخفیف' },
];

export interface ShopQuery {
  q: string;
  colors: string[];
  sizes: string[];
  min: number;
  max: number;
  sort: SortKey;
  audience: Audience | null;
  tag: string | null;
  category: CategorySlug | null;
}

type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : []).map((s) => s.trim()).filter(Boolean);

export function parseQuery(params: RawParams, category?: string): ShopQuery {
  const min = Number(toLatinDigits(one(params.min)));
  const max = Number(toLatinDigits(one(params.max)));
  const sortRaw = one(params.sort) as SortKey;
  return {
    q: one(params.q),
    colors: list(params.colors).filter((c) => COLORS[c]),
    sizes: list(params.sizes).filter((s) => ALL_SIZES.some((x) => x.key === s)),
    min: Number.isFinite(min) && min > 0 ? min : PRICE_BOUNDS.min,
    max: Number.isFinite(max) && max > 0 ? max : PRICE_BOUNDS.max,
    sort: SORT_OPTIONS.some((s) => s.key === sortRaw) ? sortRaw : 'popular',
    audience: (['women', 'men', 'kids', 'unisex'].includes(one(params.audience)) ? one(params.audience) : null) as Audience | null,
    tag: one(params.tag) || null,
    category: (category as CategorySlug) ?? null,
  };
}

const norm = (s: string) =>
  s
    .replace(/[ىي]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u064B-\u0652]/g, '')
    .toLowerCase();

export function filterProducts(query: ShopQuery, source: Product[] = PRODUCTS) {
  const q = norm(query.q.trim());
  return source.filter((p) => {
    if (query.category && p.category !== query.category) return false;
    if (query.audience && p.audience !== query.audience && p.audience !== 'unisex') return false;
    if (query.tag && !p.tags.includes(query.tag as never)) return false;
    if (p.price < query.min || p.price > query.max) return false;
    if (query.colors.length && !p.colors.some((c) => query.colors.includes(c))) return false;
    if (query.sizes.length && !p.sizes.some((s) => query.sizes.includes(s))) return false;
    if (q) {
      const haystack = norm(
        [p.name, p.subtitle, p.description.join(' '), colorOf(p.colors[0]).name, ...p.tags].join(' '),
      );
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function sortProducts(items: Product[], sort: SortKey) {
  const copy = [...items];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'discount':
      return copy.sort(
        (a, b) =>
          (b.compareAtPrice ? 1 - b.price / b.compareAtPrice : 0) -
          (a.compareAtPrice ? 1 - a.price / a.compareAtPrice : 0),
      );
    default:
      return copy.sort((a, b) => b.popularity - a.popularity);
  }
}

/** build a query string from the current query + a patch */
export function buildHref(base: string, query: Partial<ShopQuery>, patch: Partial<ShopQuery> = {}) {
  const merged = { ...query, ...patch };
  const sp = new URLSearchParams();
  if (merged.q) sp.set('q', merged.q);
  if (merged.colors?.length) sp.set('colors', merged.colors.join(','));
  if (merged.sizes?.length) sp.set('sizes', merged.sizes.join(','));
  if (merged.min && merged.min !== PRICE_BOUNDS.min) sp.set('min', String(merged.min));
  if (merged.max && merged.max !== PRICE_BOUNDS.max) sp.set('max', String(merged.max));
  if (merged.sort && merged.sort !== 'popular') sp.set('sort', merged.sort);
  if (merged.audience) sp.set('audience', merged.audience);
  if (merged.tag) sp.set('tag', merged.tag);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export const COLOR_FILTERS = ['cream', 'oat', 'sage', 'blush', 'rose', 'dove', 'charcoal', 'black', 'navy'];
export const SIZE_FILTERS = ['s', 'm', 'l', 'xl', 'festival', 'standard', 'kids-s', 'kids-m', 'kids-l', 'xxl', 'one'];

export const FILTER_SIZE_LABEL = (key: string) => (key === 'one' ? 'یک اندازه' : sizeLabel(key));

export const AUDIENCE_LABELS: Record<string, string> = {
  women: 'زنانه',
  men: 'مردانه',
  kids: 'کودکان',
  unisex: 'زنانه و مردانه',
};

export const TAG_LABELS: Record<string, string> = {
  new: 'تازه‌ها',
  bestseller: 'پرفروش‌ها',
  recommended: 'پیشنهاد الاردشاپ',
  gift: 'هدیه',
  winter: 'کالکشن زمستان',
  cotton: 'نخی',
  sheer: 'شفاف',
};
