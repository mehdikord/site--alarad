export type CategorySlug = string;
export type Audience = 'women' | 'men' | 'kids' | 'unisex';
export type ProductTag = string;

/** seed-data shape (prisma/seeders/data/categories.ts) */
export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  image: string;
  count: number;
  accent: string;
}

/** nested category as served to the storefront */
export interface CategoryNode {
  id: number;
  parentId: number | null;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string | null;
  imageBlur: string | null;
  accent: string | null;
  productCount: number;
  children: CategoryNode[];
}

export interface ProductImage {
  src: string;
  blur: string;
  /** colour key this photo belongs to (null = all colours) */
  color: string | null;
  alt?: string;
}

export interface ColorOption {
  key: string;
  name: string;
  hex: string;
  /** CSS gradient used to make swatches feel like fabric, not flat paint */
  swatch?: string;
}

export interface SizeOption {
  key: string;
  label: string;
  note?: string;
}

export interface Variant {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  price?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string[];
  /** leaf category slug */
  category: CategorySlug;
  categoryName: string;
  /** root → leaf */
  categoryPath: { slug: string; name: string }[];
  audience: Audience;
  price: number;
  compareAtPrice?: number;
  colors: string[];
  sizes: string[];
  variants: Variant[];
  images: ProductImage[];
  palette: Record<string, ColorOption>;
  sizeMeta: Record<string, SizeOption>;
  details: { material: string; care: string; origin: string };
  rating: number;
  reviewCount: number;
  tags: ProductTag[];
  createdAt: string;
  popularity: number;
  /** review highlights shown on PDP */
  highlights: string[];
}

export interface CartItem {
  key: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  color: string;
  colorName: string;
  colorHex: string;
  size: string;
  sizeLabel: string;
  price: number;
  qty: number;
  maxStock: number;
  image: string;
}

export interface Address {
  fullName: string;
  phone: string;
  provinceId: number | null;
  cityId: number | null;
  postalCode: string;
  line1: string;
  line2?: string;
  notes?: string;
}

export interface ShippingMethod {
  id: string;
  title: string;
  cost: number;
  eta: string;
  description: string;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  grandTotal: number;
  itemCount: number;
  freeShippingGap: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

/** order as shown to the customer */
export interface OrderView {
  code: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'online' | 'cod';
  items: {
    id: number;
    productSlug: string | null;
    name: string;
    sku: string | null;
    colorName: string | null;
    colorHex: string | null;
    sizeLabel: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
  receiver: { name: string; phone: string; province: string; city: string; postalCode: string; address: string; unit: string | null };
  shipping: { title: string; eta: string; cost: number };
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number; itemCount: number };
  couponCode: string | null;
  payment: { gateway: string; refId: string | null; cardPan: string | null; paidAt: string | null } | null;
  shipments: {
    carrier: string | null;
    trackingCode: string | null;
    trackingUrl: string | null;
    status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned';
    shippedAt: string | null;
    deliveredAt: string | null;
  }[];
  timeline: { status: OrderStatus; note: string | null; at: string }[];
  canPay: boolean;
  canCancel: boolean;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

export interface Review {
  id: string;
  productSlug: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  verified: boolean;
  reply?: string;
}
