'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import type { CartItem, Product, User } from '@/lib/types';
import { imagesForColor } from '@/lib/card';

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
  /** apply server-side validation (price / stock changes, removed variants) */
  sync: (lines: { variantId: string; price: number; maxStock: number }[], removed: string[]) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const cartKey = (variantId: string) => `v:${variantId}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastAdded: null,
      add: (incoming) => {
        const key = cartKey(incoming.variantId);
        const existing = get().items.find((i) => i.key === key);
        const max = incoming.maxStock;
        set({
          items: existing
            ? get().items.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + incoming.qty, max), maxStock: max, price: incoming.price } : i))
            : [...get().items, { ...incoming, qty: Math.min(incoming.qty, max), key }],
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
      sync: (lines, removed) => {
        const byId = new Map(lines.map((l) => [l.variantId, l]));
        set({
          items: get()
            .items.filter((i) => !removed.includes(i.variantId))
            .map((i) => {
              const l = byId.get(i.variantId);
              if (!l) return i;
              return { ...i, price: l.price, maxStock: l.maxStock, qty: Math.max(1, Math.min(i.qty, l.maxStock)) };
            })
            .filter((i) => i.maxStock > 0),
        });
      },
      clear: () => set({ items: [], lastAdded: null }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: 'alarad-cart',
      version: 2,
      skipHydration: true,
      partialize: (s) => ({ items: s.items }) as CartState,
      // v1 carts came from the mock catalogue (no variant ids) — drop them
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as { items?: CartItem[] };
        if (version < 2) return { items: [] } as unknown as CartState;
        return { items: (state.items ?? []).filter((i) => i.variantId) } as unknown as CartState;
      },
    },
  ),
);

/** Build a cart item from product + selection (shared by PDP and quick-add). */
export function makeCartItem(product: Product, color: string, size: string, qty: number): Omit<CartItem, 'key'> | null {
  const variant = product.variants.find((v) => v.color === color && v.size === size);
  if (!variant) return null;
  const c = product.palette[color];
  return {
    productId: product.id,
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    color,
    colorName: c?.name ?? '',
    colorHex: c?.hex ?? '',
    size,
    sizeLabel: product.sizeMeta[size]?.label ?? size,
    price: variant.price ?? product.price,
    qty,
    maxStock: variant.stock,
    image: imagesForColor(product.images, color || null)[0]?.src ?? '/images/hero.webp',
  };
}

/* ───────────────────────────── auth ───────────────────────────── */
interface AuthState {
  user: User | null;
  /** true once /api/auth/me has answered */
  ready: boolean;
  setUser: (user: User | null) => void;
  refresh: () => Promise<User | null>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user, ready: true }),
  refresh: async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = (await res.json()) as { user: User | null };
      set({ user: json.user, ready: true });
      return json.user;
    } catch {
      set({ ready: true });
      return null;
    }
  },
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    set({ user: null, ready: true });
  },
}));

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

/* ─────────────────────────── tiny fetch helper ─────────────────────────── */
export async function api<T = unknown>(url: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T & { ok: boolean; message?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, ...json } as T & { ok: boolean; message?: string };
  } catch {
    return { ok: false, message: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.' } as T & { ok: boolean; message?: string };
  }
}
