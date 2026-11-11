'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { colorOf, sizeLabel } from '@/lib/data/taxonomy';
import { productBySlug } from '@/lib/data/products';
import { shot } from '@/lib/images';

/* ───────────────────────── hydration guard ───────────────────────── */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/* ───────────────────────────── cart ───────────────────────────── */
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  lastAdded: string | null;
  add: (item: Omit<CartItem, 'key'>) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const cartKey = (productId: string, color: string, size: string) => `${productId}:${color}:${size}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastAdded: null,
      add: (incoming) => {
        const key = cartKey(incoming.productId, incoming.color, incoming.size);
        const existing = get().items.find((i) => i.key === key);
        const max = incoming.maxStock;
        set({
          items: existing
            ? get().items.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + incoming.qty, max) } : i))
            : [...get().items, { ...incoming, key }],
          isOpen: true,
          lastAdded: key,
        });
      },
      remove: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      setQty: (key, qty) =>
        set({
          items: get()
            .items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock)) } : i))
            .filter((i) => i.qty > 0),
        }),
      clear: () => set({ items: [], lastAdded: null }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
    }),
    { name: 'alarad-cart', skipHydration: true, partialize: (s) => ({ items: s.items }) as CartState },
  ),
);

/** Build a cart item from product + selection (shared by PDP and quick-add). */
export function makeCartItem(product: Product, color: string, size: string, qty: number, stock: number): Omit<CartItem, 'key'> {
  const c = colorOf(color);
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    color,
    colorName: c.name,
    colorHex: c.hex,
    size,
    sizeLabel: sizeLabel(size),
    price: product.price,
    qty,
    maxStock: stock,
    image: shot(product.shots[0], color).src,
  };
}

/* ─────────────────────────── catalog ─────────────────────────── */
export interface ProductPatch {
  name?: string;
  subtitle?: string;
  price?: number;
  compareAtPrice?: number | null;
  tags?: Product['tags'];
  archived?: boolean;
}

interface CatalogState {
  patches: Record<string, ProductPatch>;
  stock: Record<string, number>;
  custom: Product[];
  patchProduct: (id: string, patch: ProductPatch) => void;
  setStock: (variantId: string, value: number) => void;
  setColorSizeStock: (productId: string, color: string, size: string, value: number) => void;
  addProduct: (p: Product) => void;
  reset: () => void;
}

export const useCatalog = create<CatalogState>()(
  persist(
    (set, get) => ({
      patches: {},
      stock: {},
      custom: [],
      patchProduct: (id, patch) => set({ patches: { ...get().patches, [id]: { ...get().patches[id], ...patch } } }),
      setStock: (variantId, value) => set({ stock: { ...get().stock, [variantId]: Math.max(0, value) } }),
      setColorSizeStock: (productId, color, size, value) => {
        const variantId = `${productId}-${color}-${size}`;
        set({ stock: { ...get().stock, [variantId]: Math.max(0, value) } });
      },
      addProduct: (p) => set({ custom: [p, ...get().custom] }),
      reset: () => set({ patches: {}, stock: {}, custom: [] }),
    }),
    { name: 'alarad-catalog', skipHydration: true },
  ),
);

/** merge helper used by client components */
export function mergeProduct(base: Product, patches: Record<string, ProductPatch>): Product {
  const patch = patches[base.id];
  if (!patch) return base;
  return {
    ...base,
    name: patch.name ?? base.name,
    subtitle: patch.subtitle ?? base.subtitle,
    price: patch.price ?? base.price,
    compareAtPrice: patch.compareAtPrice === null ? undefined : patch.compareAtPrice ?? base.compareAtPrice,
    tags: patch.tags ?? base.tags,
  };
}

export function resolveStock(product: Product, color: string, size: string, stockMap: Record<string, number>) {
  const variantId = `${product.id}-${color}-${size}`;
  if (stockMap[variantId] !== undefined) return stockMap[variantId];
  const v = product.variants.find((x) => x.color === color && x.size === size);
  return v?.stock ?? 0;
}

export function resolveTotalStock(product: Product, stockMap: Record<string, number>) {
  return product.variants.reduce((sum, v) => sum + (stockMap[v.id] ?? v.stock), 0);
}

/** client hook: product with admin overrides + stock map */
export function useLiveProduct(slug: string) {
  const { patches, stock, custom } = useCatalog();
  const base = custom.find((p) => p.slug === slug) ?? productBySlug(slug);
  if (!base) return null;
  return { product: mergeProduct(base, patches), stockMap: stock };
}

/* ───────────────────────────── auth ───────────────────────────── */
interface AuthState {
  user: { name: string; phone: string } | null;
  login: (name: string, phone: string) => void;
  logout: () => void;
  update: (patch: { name?: string; phone?: string }) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (name, phone) => set({ user: { name, phone } }),
      logout: () => set({ user: null }),
      update: (patch) =>
        set({
          user: get().user
            ? { name: patch.name ?? get().user!.name, phone: patch.phone ?? get().user!.phone }
            : null,
        }),
    }),
    { name: 'alarad-auth', skipHydration: true },
  ),
);

/* ────────────────────────────── ui ────────────────────────────── */
interface UiState {
  toast: { id: number; message: string; variant?: 'default' | 'success' | 'error' } | null;
  notify: (message: string, variant?: 'default' | 'success' | 'error') => void;
  dismiss: () => void;
}

export const useUi = create<UiState>()((set) => ({
  toast: null,
  notify: (message, variant = 'default') => {
    const id = Date.now();
    set({ toast: { id, message, variant } });
    setTimeout(() => {
      if (useUi.getState().toast?.id === id) set({ toast: null });
    }, 3200);
  },
  dismiss: () => set({ toast: null }),
}));

export { useOrders, STATUS_META, STATUS_STEPS } from '@/lib/store/orders';
