'use client';

import * as React from 'react';
import Image from 'next/image';
import { ArrowDownUp, Check, Minus, Plus, Search, Truck } from 'lucide-react';
import type { Product } from '@/lib/types';
import { PRODUCTS } from '@/lib/data/products';
import { CATEGORIES } from '@/lib/data/categories';
import { COLORS, sizeLabel } from '@/lib/data/taxonomy';
import { useCatalog, useHydrated, useUi } from '@/lib/store';
import { num } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AdminPageHeader, Panel, StockPill } from '@/components/admin/ui';

export function AdminInventory() {
  const hydrated = useHydrated();
  const { stock, setColorSizeStock, custom } = useCatalog();
  const notify = useUi((s) => s.notify);
  const [query, setQuery] = React.useState('');
  const [onlyLow, setOnlyLow] = React.useState(false);
  const [bulk, setBulk] = React.useState('');

  const all = [...custom, ...PRODUCTS];
  const stockOf = (p: Product, color: string, size: string) =>
    stock[`${p.id}-${color}-${size}`] ?? p.variants.find((v) => v.color === color && v.size === size)?.stock ?? 0;

  const visible = all
    .filter((p) => (query ? p.name.includes(query) : true))
    .map((p) => {
      const total = p.variants.reduce((s, v) => s + stockOf(p, v.color, v.size), 0);
      const lowCount = p.variants.filter((v) => stockOf(p, v.color, v.size) <= 5).length;
      return { p, total, lowCount };
    })
    .filter((x) => (onlyLow ? x.lowCount > 0 : true));

  const totalUnits = all.reduce(
    (s, p) => s + p.variants.reduce((a, v) => a + (stock[v.id] ?? v.stock), 0),
    0,
  );
  const soldOut = all.reduce((s, p) => s + p.variants.filter((v) => (stock[v.id] ?? v.stock) <= 0).length, 0);

  const bumpAll = (p: Product, delta: number) => {
    p.variants.forEach((v) => {
      const next = Math.max(0, stockOf(p, v.color, v.size) + delta);
      setColorSizeStock(p.id, v.color, v.size, next);
    });
  };

  return (
    <>
      <AdminPageHeader
        title="موجودی انبار"
        description={`${num(totalUnits)} عدد در انبار · ${num(soldOut)} واریانت ناموجود`}
        action={
          <div className="flex items-center gap-2">
            <input
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder="شارژ گروهی"
              inputMode="numeric"
              className="h-9 w-24 rounded-lg border border-line bg-white px-2.5 text-center text-[0.75rem] outline-none ltr-num focus:border-sage-400"
            />
            <button
              onClick={() => {
                const n = Number(bulk);
                if (!n) return;
                all.forEach((p) => p.variants.forEach((v) => setColorSizeStock(p.id, v.color, v.size, n)));
                notify(`همهٔ واریانت‌ها روی ${num(n)} عدد تنظیم شد.`, 'success');
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-3 text-[0.75rem] text-cream-50 transition-colors hover:bg-ink-800"
            >
              <ArrowDownUp className="size-3.5" strokeWidth={2} />
              اعمال
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
            placeholder="جست‌وجوی محصول…"
            className="h-9 w-full rounded-lg border border-line bg-white ps-9 pe-3 text-[0.75rem] outline-none focus:border-sage-400"
          />
        </div>
        <button
          onClick={() => setOnlyLow((v) => !v)}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-lg px-3 text-[0.75rem] transition-colors',
            onlyLow ? 'bg-blush-100 text-blush-500' : 'border border-line bg-white text-ink-500 hover:border-blush-300',
          )}
        >
          فقط کم‌موجود
        </button>
        <p className="ms-auto text-[0.6875rem] text-ink-400">
          نکته: واریانت‌های ≤ ۵ با رنگ گلبهی، ناموجودها با خاکستری مشخص می‌شوند.
        </p>
      </div>

      <div className="space-y-3">
        {!hydrated
          ? [1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)
          : visible.map(({ p, total, lowCount }) => (
              <Panel
                key={p.id}
                title={p.name}
                description={`${CATEGORIES.find((c) => c.slug === p.category)?.name} · ${num(p.colors.length)} رنگ · ${num(p.sizes.length)} سایز`}
                action={
                  <div className="flex items-center gap-2">
                    <StockPill stock={total} />
                    {lowCount > 0 && (
                      <span className="rounded-full bg-blush-100 px-1.5 py-0.5 text-[0.5625rem] text-blush-500">
                        {num(lowCount)} کم‌موجود
                      </span>
                    )}
                    <button
                      onClick={() => bumpAll(p, 10)}
                      className="flex h-7 items-center gap-1 rounded-full bg-sage-100 px-2 text-[0.5625rem] text-sage-700 transition-colors hover:bg-sage-200"
                    >
                      <Truck className="size-3" strokeWidth={2} />
                      +۱۰ همه
                    </button>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-separate border-spacing-1">
                    <thead>
                      <tr>
                        <th className="w-32 text-start text-[0.5625rem] font-normal text-ink-300">رنگ / سایز</th>
                        {p.sizes.map((s) => (
                          <th key={s} className="text-[0.5625rem] font-normal text-ink-400">
                            {sizeLabel(s)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.colors.map((c) => (
                        <tr key={c}>
                          <td className="py-0.5">
                            <span className="flex items-center gap-1.5 text-[0.625rem] text-ink-600">
                              <span className="size-2.5 rounded-full border border-white shadow-sm" style={{ backgroundImage: COLORS[c]?.swatch }} />
                              {COLORS[c]?.name}
                            </span>
                          </td>
                          {p.sizes.map((s) => {
                            const val = stockOf(p, c, s);
                            return (
                              <td key={s}>
                                <div
                                  className={cn(
                                    'flex items-center justify-between gap-0.5 rounded-md border px-1 py-0.5',
                                    val <= 0 ? 'border-cream-300 bg-cream-100' : val <= 5 ? 'border-blush-200 bg-blush-100/40' : 'border-line bg-cream-50',
                                  )}
                                >
                                  <button
                                    onClick={() => setColorSizeStock(p.id, c, s, val - 1)}
                                    aria-label="کاهش"
                                    className="flex size-4 items-center justify-center rounded text-ink-400 hover:text-ink-900"
                                  >
                                    <Minus className="size-2.5" strokeWidth={3} />
                                  </button>
                                  <input
                                    value={val}
                                    onChange={(e) => setColorSizeStock(p.id, c, s, Number(e.target.value.replace(/\D/g, '')) || 0)}
                                    className={cn(
                                      'w-8 bg-transparent text-center text-[0.6875rem] outline-none ltr-num',
                                      val <= 0 ? 'text-ink-300' : val <= 5 ? 'text-blush-500' : 'text-ink-900',
                                    )}
                                    inputMode="numeric"
                                    aria-label={`${COLORS[c]?.name} ${sizeLabel(s)}`}
                                  />
                                  <button
                                    onClick={() => setColorSizeStock(p.id, c, s, val + 1)}
                                    aria-label="افزایش"
                                    className="flex size-4 items-center justify-center rounded text-ink-400 hover:text-ink-900"
                                  >
                                    <Plus className="size-2.5" strokeWidth={3} />
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            ))}
        {hydrated && !visible.length && (
          <p className="rounded-xl border border-line-soft bg-white p-10 text-center text-[0.8125rem] text-ink-400">
            محصولی با این فیلتر پیدا نشد.
          </p>
        )}
      </div>
    </>
  );
}

export { Check, Image };
