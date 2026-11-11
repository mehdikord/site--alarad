export type CategorySlug = 'socks' | 'tights' | 'hair' | 'underwear';
export type Audience = 'women' | 'men' | 'kids' | 'unisex';
export type ProductTag = 'new' | 'bestseller' | 'recommended' | 'gift' | 'winter' | 'cotton' | 'sheer';

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
  category: CategorySlug;
  audience: Audience;
  price: number;
  compareAtPrice?: number;
  colors: string[];
  sizes: string[];
  variants: Variant[];
  /** asset keys without colour suffix; resolved per selected colour */
  shots: string[];
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
  province: string;
  city: string;
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

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderTimelineEntry {
  status: OrderStatus | 'placed';
  at: string;
  note?: string;
}

export interface Order {
  code: string;
  createdAt: string;
  items: CartItem[];
  address: Address;
  shipping: ShippingMethod;
  payment: { method: string; maskedCard: string; paidAt: string; ref: string };
  coupon?: { code: string; amount: number };
  totals: CartTotals;
  status: OrderStatus;
  timeline: OrderTimelineEntry[];
  phone: string;
}

export interface User {
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
}
