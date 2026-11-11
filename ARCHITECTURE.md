# الاردشاپ — Architecture & Design System

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand (persisted) · Vazirmatn (variable, self-hosted) · Mock data layer

---

## 1. Project structure

```
alarad-shop/
├── app/
│   ├── layout.tsx                  # <html lang="fa" dir="rtl">, fonts, Providers, Header/Footer, CartDrawer
│   ├── template.tsx                # page transition wrapper (Framer Motion)
│   ├── globals.css                 # Tailwind v4 @theme tokens + base layer
│   ├── page.tsx                    # ۱. خانه (Home)
│   ├── shop/
│   │   ├── page.tsx                # ۲. فروشگاه (filters/sort/search, URL-driven)
│   │   └── [category]/page.tsx     # category landing (same grid, preset filters, SEO copy)
│   ├── product/[slug]/page.tsx     # ۳. جزئیات محصول
│   ├── cart/page.tsx               # سبد خرید
│   ├── checkout/
│   │   ├── page.tsx                # 3-step checkout (address → shipping → payment)
│   │   └── success/[code]/page.tsx # تأیید سفارش + کد رهگیری
│   ├── account/
│   │   ├── page.tsx                # ورود/ثبت‌نام + داشبورد + سابقه سفارش
│   │   └── orders/[code]/page.tsx  # جزئیات و رهگیری سفارش
│   ├── admin/
│   │   ├── layout.tsx              # پنل مدیریت (sidebar)
│   │   ├── page.tsx                # داشبورد فروش
│   │   ├── products/page.tsx       # مدیریت محصولات + واریانت‌ها
│   │   ├── orders/page.tsx         # مدیریت سفارش‌ها
│   │   └── inventory/page.tsx      # موجودی انبار (ماتریس رنگ×سایز)
│   ├── not-found.tsx
│   └── loading.tsx
├── components/
│   ├── layout/      Header, MobileMenu, Footer, AnnouncementBar, CartDrawer, Providers
│   ├── home/        Hero, TrustStrip, CategoryGrid, ProductRail, EditorialBanner, Reviews, InstagramStrip
│   ├── product/     ProductCard, ProductGrid, Gallery, ColorSelector, SizeSelector, AddToCart, RelatedProducts,
│   │                FiltersPanel, SortBar, SearchInput, ActiveFilters, Pagination/LoadMore
│   ├── cart/        CartLine, OrderSummary, FreeShippingMeter, CouponField
│   ├── checkout/    Stepper, AddressForm, ShippingMethod, PaymentPanel, ReviewStep
│   ├── account/     AuthCard, OrderList, TrackingTimeline
│   ├── admin/       KpiCard, SalesChart, ProductTable, ProductEditorDrawer, VariantMatrix, OrdersTable
│   ├── ui/          Button, IconButton, Input, Select, Textarea, Badge, Chip, Sheet, Dialog, Accordion,
│   │                QuantityStepper, Skeleton, EmptyState, Toast, RatingStars, Divider, Segmented
│   └── motion/      Reveal, Stagger, MagneticButton, PageFade
├── lib/
│   ├── types.ts       # Product, Variant, CartItem, Order, User …
│   ├── data/          # seed: products.ts, categories.ts, colors.ts, sizes.ts, reviews.ts, provinces.ts
│   ├── store/         # cart.ts, orders.ts, auth.ts, catalog.ts, ui.ts  (zustand + persist)
│   ├── image-manifest.json   # generated: src + blurDataURL per asset
│   ├── images.ts      # helpers (productImage(product, color, shot))
│   ├── pricing.ts     # subtotal, shipping, discounts, totals
│   ├── format.ts      # fa-IR digits, تومان, dates, number→Persian
│   └── utils.ts       # cn(), slugify, clamp, uid, tracking code
├── scripts/gen-images.mjs    # sharp pipeline: crop × color-tint → WebP + blur placeholders
└── public/images/…           # optimized assets (1400px, WebP)
```

**Rendering strategy:** pages are Server Components; interactivity lives in small client islands (`"use client"`). Catalog is static seed data → instant SSR, no data fetching, no layout shift. Cart / orders / auth / admin edits persist in `localStorage` via Zustand `persist` with **`skipHydration: true` + post-mount rehydrate**, so markup never mismatches between server and client (no hydration flicker).

**Why not `output: 'export'`:** required to run as a real Next server (image optimizer, dynamic routes, streaming).

---

## 2. Data schema

```ts
type CategorySlug = 'socks' | 'tights' | 'hair' | 'underwear';
type Audience     = 'women' | 'men' | 'kids' | 'unisex';

interface ColorOption {          // palette entry, shared across catalog
  key: string;                   // 'cream'
  name: string;                  // 'کرم'
  hex: string;                   // '#F1E7DA'  (swatch + tint seed)
  tint?: { hue?: number; saturation?: number; brightness?: number };  // sharp modulate, keeps photos on-brand
}

interface SizeOption { key: string; label: string; note?: string }      // 'shoe-36-40' → '۳۶ تا ۴۰'

interface Variant {                // the single source of truth for price & stock
  id: string;                      // 'sock-ankle-cream-m-1'
  sku: string;                     // 'AL-SK-001-CR-M'
  color: string;                   // ColorOption.key
  size: string;                    // SizeOption.key
  stock: number;                   // 0 | 1..5 → کم‌موجود | >5
  price?: number;                  // optional override (e.g. larger size)
}

interface Product {
  id: string; slug: string;
  name: string; subtitle: string;
  description: string;            // 2–3 short Persian paragraphs
  category: CategorySlug; audience: Audience;
  price: number;                  // تومان, integer
  compareAtPrice?: number;        // shows soft "٪۱۵" badge, no loud sale styling
  colors: string[];               // ordered ColorOption keys
  sizes: string[];                // ordered SizeOption keys
  variants: Variant[];
  shots: string[];                // image asset keys → gallery (4:5), index 0 = card
  details: { material: string; care: string; origin: string };
  rating: number; reviewCount: number;
  tags: ('new'|'bestseller'|'recommended'|'gift'|'winter'|'cotton')[];
  createdAt: string;              // ISO — drives "جدیدترین"
  popularity: number;             // drives "پرفروش‌ترین"
}

interface CartItem {
  key: string;                    // `${productId}:${color}:${size}`
  productId: string; slug: string; name: string;
  image: string; color: string; colorName: string;
  size: string; sizeLabel: string;
  price: number; qty: number; maxStock: number;
}

interface Address { fullName, phone, province, city, postalCode, line1, line2?, notes? }

interface Order {
  code: string;                   // 'AL-1404-4821' (tracking code)
  createdAt: string;
  items: CartItem[];
  address: Address;
  shipping: { id: string; title: string; cost: number; eta: string };
  payment: { method: 'gateway'; maskedCard: string; paidAt: string };
  coupon?: { code: string; amount: number };
  totals: { subtotal, shipping, discount, tax, grandTotal };
  status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled';
  timeline: { status: string; at: string; note?: string }[];
  userPhone?: string;
}
```

**Business rules (mock):** free shipping over ۵۰۰٬۰۰۰ تومان · ۹٪ مالیات بر ارزش افزوده · coupons `ALARAD10` (−۱۰٪) and `WELCOME15` (−۱۵٪، سقف ۱۵۰٬۰۰۰) · low stock ≤ ۵ · sold out = variant stock ۰.

Products ship with 2–5 colors and category-appropriate sizes; every card computes total stock from variants, so low-stock and sold-out states are real, not decorative.

---

## 3. Design system

### Colour tokens (Tailwind v4 `@theme`)
| token | value | use |
|---|---|---|
| `--color-cream-50` | `#FFFCF9` | page background |
| `--color-cream-100` | `#F8F4F0` | base cream (requested) |
| `--color-cream-200` | `#F5EDE6` | section fills (requested) |
| `--color-cream-300` | `#EFE5DB` | image placeholders |
| `--color-blush-100` | `#F7E8E4` | very subtle blush fills |
| `--color-blush-300` | `#E9D2CB` | tiny accents only |
| `--color-sage-100` | `#EDF1EA` | quiet emphasis |
| `--color-sage-200` | `#D5DDCE` | borders on sage cards |
| `--color-sage-400` | `#A8B5A2` | accent (requested) |
| `--color-sage-500` | `#8FA08C` | accent strong (requested) |
| `--color-sage-600` | `#71816B` | accent for text/icons on cream |
| `--color-ink-900` | `#302C29` | primary text (soft charcoal) |
| `--color-ink-700` | `#4B4540` | headings secondary |
| `--color-ink-500` | `#6E665F` | body muted |
| `--color-ink-300` | `#A39A92` | captions, meta |
| `--color-line` | `#E9DFD5` | hairline borders |
| `--color-white` | `#FFFFFF` | cards, surfaces |

No pure black, no saturated hue anywhere; CTAs are charcoal or sage, never neon.

### Typography (Vazirmatn Variable, self-hosted → no FOUT, no CDN)
| role | size (mobile → desktop) | weight | line-height | tracking |
|---|---|---|---|---|
| display | 30 → 52 | 600 | 1.28 | 0 (Persian never needs negative tracking) |
| h1 | 26 → 38 | 600 | 1.35 | — |
| h2 | 21 → 28 | 600 | 1.4 | — |
| h3 | 17 → 20 | 600 | 1.5 | — |
| body | 15 → 16 | 400 | **1.85** | — |
| body-sm | 13.5 → 14 | 400 | 1.8 | — |
| caption | 12 | 500 | 1.6 | — |
| price | 17 → 20 | 600 | 1.2 | `font-variant-numeric: tabular` |

Persian needs generous line-height (1.8–1.9) and no letter-spacing tricks. Digits are rendered with `fa-IR` locale (۹٬۰۰۰). Long-form text capped at 62ch.

### Spacing & layout
4px base scale; section rhythm `py-16 → py-28`; container `max-w-[1240px] px-4 sm:px-6 lg:px-8`. Grid: 2 cols mobile → 3 tablet → 4 desktop, gap 3 → 6. Generous whitespace is the primary luxury signal.

### Shape, depth, motion
- Radii: `sm 10`, `md 16`, `lg 22`, `xl 28`, `2xl 36`, `pill 999` — imagery always ≥ 22 → soft, editorial.
- Shadows (never harsh): `shadow-soft` `0 1px 2px rgba(58,50,44,.04), 0 10px 26px -16px rgba(58,50,44,.14)`; `shadow-lift` on hover; `shadow-float` for sheets.
- Borders: 1px `--color-line`, never grey-blue.
- Motion language: entrance `opacity 0→1`, `y 16→0`, `filter blur(6px)→0`, 600–800 ms, ease `[0.22,1,0.36,1]`; stagger 60–90 ms. Hover: image `scale 1.045` 700 ms, card lift 4 px. Tap: `scale .985`. Sheets spring `stiffness 260 / damping 30`. All wrapped in `useReducedMotion` guards.

### Components (states defined before build)
- **Button** — variants: `primary` (charcoal), `sage`, `outline`, `ghost`, `soft`; sizes sm/md/lg; states default/hover/active/focus-ring (`sage-400` 3px offset ring)/loading (spinner, label kept)/disabled; min height 44 px touch target; full-width on mobile CTAs.
- **ProductCard** — 4:5 image w/ blur placeholder, hover zoom + quick-view pill, `new` / `کم‌موجود` / `ناموجود` badges, name (2-line clamp), muted price, compare-at strikethrough, colour swatches (max 4 + `+۲`), size chips. Whole card is one link; swatches switch the displayed image.
- **ColorSelector** — 28 px circles with inner ring when active, name label underneath, disabled state for out-of-stock colours.
- **SizeSelector** — pill chips, selected = charcoal fill, disabled = strike + tooltip "ناموجود"; under 5 stock shows «تنها ۲ عدد».
- **Inputs** — 48 px, cream fill, 1px line, focus = sage ring + white fill, error = blush text + ring, floating Persian label, `inputMode` numeric for phone/postal, LTR direction for card/phone digits.
- **Badges** — pill, sage-100 / blush-100 / ink-900(8%) backgrounds, 11–12 px medium.
- **Sheet / Dialog** — mobile filters & mobile menu (full-height, spring, backdrop blur 4px + cream overlay 60%).
- **Empty / loading** — hand-written Persian copy + soft illustration (SVG line art), skeleton blocks in `cream-300` with slow shimmer (no spinners in content areas).

### RTL & mobile-first
`dir="rtl"` on `<html>`; logical properties (`ps/pe`, `start/end`, `ms/me`) everywhere; icons mirrored where directional; sticky mobile CTA above safe-area inset; 44 px minimum targets; drawer opens from the left (RTL "end"); iOS momentum scroll for rails; `100dvh` for sheets; no horizontal overflow.

### Performance
- Images: sharp pipeline → WebP, 1400 px max, one asset per (shot × colour), `next/image` with `sizes`, `quality 82`, blur `data:` placeholders → **zero CLS**.
- Font self-hosted variable woff2, `display: swap`, preloaded, only 2 weights used visually.
- No client-side data fetching; only icons actually imported from `lucide-react`; Framer Motion limited to transform/opacity (GPU).
- Grid/list rendering server-side; client stores are tiny persisted slices.

---

## 4. Build order
1. Tokens, fonts, base layout, UI primitives → 2. Catalog seed + image pipeline → 3. Home → 4. Shop/filters → 5. PDP → 6. Cart/checkout/success → 7. Account → 8. Admin → 9. Polish, a11y, build & verify.
