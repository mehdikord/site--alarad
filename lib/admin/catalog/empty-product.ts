import type { ProductPayload } from '@/lib/admin/catalog/product-types';

/** blank payload for /admins/products/new (server-safe) */
export function emptyProduct(): ProductPayload {
  return {
    id: null,
    name: '',
    slug: '',
    subtitle: '',
    description: '',
    categoryId: null,
    audience: 'women',
    status: 'draft',
    isFeatured: false,
    price: 0,
    compareAtPrice: null,
    material: '',
    care: '',
    origin: '',
    highlights: [],
    tagIds: [],
    metaTitle: '',
    metaDescription: '',
    variants: [],
    images: [],
  };
}
