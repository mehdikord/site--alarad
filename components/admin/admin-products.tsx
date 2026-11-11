'use client';

import * as React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import type { Product } from '@/lib/types';
import { PRODUCTS } from '@/lib/data/products';
import { CATEGORIES } from '@/lib/data/categories';
import { COLORS, sizeLabel } from '@/lib/data/taxonomy';
import { useCatalog, useHydrated, useUi } from '@/lib/store';
import { money, num, toman } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AdminPageHeader, Panel, StockPill } from '@/components/admin/ui';
import { Sheet } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';

export function AdminProducts() {
  const hydrated = useHydrated();
  const { patches, stock, custom, patchProduct, setColorSizeStock, addProduct, reset } = useCatalog();
  const notify = useUi((s) => s.notify);

  const [query, setQuery] = React.useState('');
  const [cat, setCat] = React.useState<string>('all');
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [creating, setCreating] = React.useState(false);

  const all = [...custom, ...PRODUCTS];
  const visible = all.filter((p) => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (query && !p.name.includes(query) && !p.slug.includes(query)) return false;
    return true;
  });

  const stockOf = (p: Product, color: string, size: string) =>
    stock[`${p.id}-${color}-${size}`] ?? p.variants.find((v) => v.color === color && v.size === size)?.stock ?? 0;
  const totalOf = (p: Product) => p.variants.reduce((s, v) => s + (stock[v.id] ?? v.stock), 0);

  return (
    <>
      <AdminPageHeader
        title="محصولات"
        description={`${num(all.length)} محصول · ${num(all.reduce((s, p) => s + p.variants.length, 0))} واریانت رنگ و سایز`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => {
                reset();
                notify('تغییرات محلی بازنشانی شد.');
              }}
              className="h-9 rounded-lg border border-line px-3 text-[0.75rem] text-ink-500 transition-colors hover:border-blush-300 hover:text-blush-500"
            >
              بازنشانی
            </button>
            <button
              onClick={() => setCreating(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-3.5 text-[0.75rem] text-cream-50 transition-colors hover:bg-ink-800"
            >
              <Plus className="size-3.5" strokeWidth={2.2} />
              محصول جدید
            </button>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" strokeWidth={1.9} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی نام یا اسلاگ…"
            className="h-9 w-full rounded-lg border border-line bg-white ps-9 pe-3 text-[0.75rem] outline-none focus:border-sage-400"
          />
        </div>
        <div className="rail no-scrollbar flex gap-1 overflow-x-auto">
          {[{ slug: 'all', name: 'همه' }, ...CATEGORIES].map((c) => (
            <button
              key={c.slug}
              onClick={() => setCat(c.slug)}
              className={cn(
                'h-9 shrink-0 rounded-lg px-3 text-[0.75rem] transition-colors',
                cat === c.slug ? 'bg-ink-900 text-cream-50' : 'border border-line bg-white text-ink-500 hover:border-sage-400',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
        {/* table header (desktop) */}
        <div className="hidden grid-cols-[2.2fr_0.9fr_0.8fr_0.7fr_0.7fr_auto] gap-3 border-b border-line-soft bg-cream-100/60 px-4 py-2.5 text-[0.625rem] font-medium text-ink-400 lg:grid">
          <span>محصول</span>
          <span>دسته</span>
          <span>قیمت</span>
          <span>رنگ‌ها</span>
          <span>موجودی</span>
          <span className="w-16 text-end">ویرایش</span>
        </div>

        {!hydrated ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-line-soft">
            {visible.map((p) => {
              const patch = patches[p.id] ?? {};
              const price = patch.price ?? p.price;
              const total = totalOf(p);
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-cream-50 lg:grid lg:grid-cols-[2.2fr_0.9fr_0.8fr_0.7fr_0.7fr_auto] lg:items-center lg:gap-3 lg:px-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-cream-200">
                      <Image src={`/images/${p.shots[0]}__${p.colors[0]}.webp`} alt="" fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[0.75rem] font-medium text-ink-900">{patch.name ?? p.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.5625rem] text-ink-400">
                        <span>{CATEGORIES.find((c) => c.slug === p.category)?.name}</span>
                        <span className="text-cream-400">·</span>
                        <span className="text-ink-700">{money(price)} تومان</span>
                        <span className="text-cream-400 lg:hidden">·</span>
                        <span className="lg:hidden">
                          <StockPill stock={total} />
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className="hidden text-[0.6875rem] text-ink-500 lg:block">
                    {CATEGORIES.find((c) => c.slug === p.category)?.name}
                  </span>

                  <span className="hidden text-[0.6875rem] text-ink-800 lg:block">{money(price)}</span>

                  <div className="hidden items-center gap-1 lg:flex">
                    {p.colors.map((c) => (
                      <span key={c} className="size-3 rounded-full border border-white shadow-sm" style={{ backgroundImage: COLORS[c]?.swatch }} title={COLORS[c]?.name} />
                    ))}
                  </div>

                  <span className="hidden lg:block">
                    <StockPill stock={total} />
                  </span>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <div className="me-1 flex items-center gap-1 lg:hidden">
                      {p.colors.slice(0, 3).map((c) => (
                        <span key={c} className="size-2.5 rounded-full border border-white shadow-sm" style={{ backgroundImage: COLORS[c]?.swatch }} />
                      ))}
                    </div>
                    <button
                      onClick={() => setEditing(p)}
                      className="flex size-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-cream-200 hover:text-ink-900"
                      aria-label="ویرایش"
                    >
                      <Pencil className="size-3.5" strokeWidth={1.8} />
                    </button>
                    <button
                      onClick={() => notify('حذف در نسخهٔ نمایشی غیرفعال است.', 'error')}
                      className="flex size-8 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-blush-100 hover:text-blush-500"
                      aria-label="حذف"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.8} />
                    </button>
                  </div>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="p-10 text-center text-[0.8125rem] text-ink-400">محصولی با این فیلتر پیدا نشد.</li>
            )}
          </ul>
        )}
      </div>

      {/* edit drawer */}
      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        side="start"
        title={editing ? `ویرایش ${editing.name}` : ''}
        footer={
          <Button full size="md" onClick={() => { setEditing(null); notify('تغییرات ذخیره شد.', 'success'); }}>
            <Check className="size-4" strokeWidth={2.4} />
            ذخیرهٔ تغییرات
          </Button>
        }
      >
        {editing && (
          <div className="space-y-5 p-4">
            <div className="grid gap-3">
              <Input
                label="نام محصول"
                value={patches[editing.id]?.name ?? editing.name}
                onChange={(e) => patchProduct(editing.id, { name: e.target.value })}
              />
              <Input
                label="قیمت (تومان)"
                value={String(patches[editing.id]?.price ?? editing.price)}
                onChange={(e) => patchProduct(editing.id, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                ltr
                inputMode="numeric"
              />
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-800">
                <SlidersHorizontal className="size-3.5 text-sage-600" strokeWidth={1.8} />
                موجودی بر اساس رنگ و سایز
              </p>
              <div className="space-y-2">
                {editing.colors.map((c) => (
                  <div key={c} className="rounded-lg border border-line-soft p-2.5">
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="size-3 rounded-full border border-white shadow-sm" style={{ backgroundImage: COLORS[c]?.swatch }} />
                      <span className="text-[0.6875rem] font-medium text-ink-800">{COLORS[c]?.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {editing.sizes.map((s) => {
                        const val = stockOf(editing, c, s);
                        return (
                          <label key={s} className="block">
                            <span className="mb-0.5 block text-[0.5625rem] text-ink-400">{sizeLabel(s)}</span>
                            <input
                              type="number"
                              min={0}
                              value={val}
                              onChange={(e) => setColorSizeStock(editing.id, c, s, Number(e.target.value) || 0)}
                              className={cn(
                                'h-8 w-full rounded-md border bg-cream-50 px-2 text-center text-[0.75rem] outline-none ltr-num focus:border-sage-400',
                                val <= 5 ? 'border-blush-200 text-blush-500' : 'border-line text-ink-800',
                              )}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-cream-100 p-3 text-[0.625rem] leading-relaxed text-ink-500">
              مجموع موجودی: <strong className="text-ink-800">{num(editing.variants.reduce((s, v) => s + stockOf(editing, v.color, v.size), 0))}</strong> عدد —
              واریانت‌های کمتر از ۵ عدد با رنگ گلبهی مشخص می‌شوند.
            </div>
          </div>
        )}
      </Sheet>

      {/* create drawer */}
      <Sheet open={creating} onClose={() => setCreating(false)} side="start" title="محصول جدید">
        <CreateProduct
          onCreate={(p) => {
            addProduct(p);
            setCreating(false);
            notify('محصول جدید اضافه شد (فقط در این مرورگر).', 'success');
          }}
        />
      </Sheet>
    </>
  );
}

function CreateProduct({ onCreate }: { onCreate: (p: Product) => void }) {
  const [name, setName] = React.useState('');
  const [cat, setCat] = React.useState<(typeof CATEGORIES)[number]['slug']>('socks');
  const [price, setPrice] = React.useState('');
  const [colors, setColors] = React.useState<string[]>(['cream']);
  const [sizeSet, setSizeSet] = React.useState<'sock' | 'tights' | 'briefs' | 'hair'>('sock');
  const [stockPer, setStockPer] = React.useState('12');

  const sizes = { sock: ['festival', 'standard'], tights: ['s', 'm', 'l', 'xl'], briefs: ['s', 'm', 'l', 'xl'], hair: ['one'] }[sizeSet];

  const submit = () => {
    if (name.trim().length < 3) return;
    const id = `custom-${Date.now()}`;
    const slug = `custom-${Date.now()}`;
    const shots = {
      socks: ['sock-ankle', 'socks-grid'],
      tights: ['tights-roll', 'tights-flat'],
      hair: ['scrunchie', 'hair-flat'],
      underwear: ['briefs-stack', 'briefs-detail'],
    }[cat];
    onCreate({
      id,
      slug,
      name: name.trim(),
      subtitle: 'محصول تازهٔ الاردشاپ',
      description: ['محصول تازه‌ای که از پنل مدیریت اضافه شده است. توضیحات تکمیلی را می‌توانید اینجا بنویسید.'],
      category: cat,
      audience: 'women',
      price: Number(price.replace(/\D/g, '')) || 99000,
      colors,
      sizes,
      variants: colors.flatMap((c) =>
        sizes.map((s) => ({
          id: `${id}-${c}-${s}`,
          sku: `AL-NEW-${s.toUpperCase()}`,
          color: c,
          size: s,
          stock: Number(stockPer) || 0,
        })),
      ),
      shots,
      details: { material: 'در حال تکمیل', care: 'در حال تکمیل', origin: 'ایران' },
      rating: 5,
      reviewCount: 0,
      tags: ['new'],
      createdAt: new Date().toISOString().slice(0, 10),
      popularity: 50,
      highlights: ['تازه رسیده'],
    });
  };

  return (
    <div className="space-y-4 p-4">
      <Input label="نام محصول" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid gap-3">
        <Select
          label="دسته"
          value={cat}
          onChange={(e) => setCat(e.target.value as typeof cat)}
          options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
        />
        <Select
          label="مجموعهٔ سایز"
          value={sizeSet}
          onChange={(e) => setSizeSet(e.target.value as typeof sizeSet)}
          options={[
            { value: 'sock', label: 'جوراب (۳۶-۴۰ / ۴۰-۴۴)' },
            { value: 'tights', label: 'جوراب‌شلواری (S تا XL)' },
            { value: 'briefs', label: 'شورت (S تا XL)' },
            { value: 'hair', label: 'یک اندازه' },
          ]}
        />
        <Input label="قیمت (تومان)" value={price} onChange={(e) => setPrice(e.target.value)} ltr inputMode="numeric" />
      </div>

      <div>
        <p className="mb-2 text-[0.75rem] font-medium text-ink-800">رنگ‌ها</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(COLORS).map((c) => {
            const active = colors.includes(c.key);
            return (
              <button
                key={c.key}
                onClick={() => setColors(active ? colors.filter((x) => x !== c.key) : [...colors, c.key])}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] transition-colors',
                  active ? 'border-sage-400 bg-sage-50 text-ink-900' : 'border-line text-ink-500',
                )}
              >
                <span className="size-2.5 rounded-full border border-white shadow-sm" style={{ backgroundImage: c.swatch }} />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <Input label="موجودی هر واریانت" value={stockPer} onChange={(e) => setStockPer(e.target.value)} ltr inputMode="numeric" />

      <div className="rounded-lg bg-cream-100 p-3 text-[0.625rem] text-ink-500">
        {num(colors.length)} رنگ × {num(sizes.length)} سایز = {num(colors.length * sizes.length)} واریانت
      </div>

      <Button full size="md" onClick={submit} disabled={name.trim().length < 3}>
        <Plus className="size-4" strokeWidth={2.2} />
        افزودن محصول
      </Button>
    </div>
  );
}

export { toman, X };
