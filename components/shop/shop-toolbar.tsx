'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { num } from '@/lib/format';
import { COLORS, sizeLabel } from '@/lib/data/taxonomy';
import { buildHref, SORT_OPTIONS, type ShopQuery, type SortKey } from '@/lib/shop';
import { FilterSheetTrigger, FilterPanel } from '@/components/shop/filter-panel';
import { Sheet } from '@/components/ui/misc';

export function ShopToolbar({
  query,
  base,
  resultCount,
  activeCount,
}: {
  query: ShopQuery;
  base: string;
  resultCount: number;
  activeCount: number;
}) {
  const router = useRouter();
  const [openFilters, setOpenFilters] = React.useState(false);
  const [openSort, setOpenSort] = React.useState(false);
  const [term, setTerm] = React.useState(query.q);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => setTerm(query.q), [query.q]);

  const push = (patch: Partial<ShopQuery>) =>
    startTransition(() => router.push(buildHref(base, query, patch), { scroll: false }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    push({ q: term.trim() });
  };

  const sortLabel = SORT_OPTIONS.find((s) => s.key === query.sort)?.label ?? 'مرتب‌سازی';

  return (
    <>
      <div className="sticky top-14 z-30 -mx-4 mb-5 border-b border-line-soft bg-cream-50/92 px-4 py-2.5 backdrop-blur-xl sm:top-16 sm:mx-0 sm:rounded-xl sm:border sm:px-3">
        <div className="flex items-center gap-2">
          {/* search */}
          <form onSubmit={submit} className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" strokeWidth={1.9} />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="جست‌وجو در این دسته…"
              aria-label="جست‌وجو"
              className="h-10 w-full rounded-full border border-line bg-white ps-9 pe-8 text-[0.75rem] outline-none transition-all duration-300 placeholder:text-ink-300 focus:border-sage-400 focus:shadow-[0_0_0_3px_rgba(168,181,162,.16)]"
            />
            {term && (
              <button
                type="button"
                onClick={() => {
                  setTerm('');
                  push({ q: '' });
                }}
                aria-label="پاک کردن جست‌وجو"
                className="absolute end-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-cream-200 text-ink-500"
              >
                <X className="size-3" strokeWidth={2.2} />
              </button>
            )}
          </form>

          {/* mobile filters */}
          <div className="lg:hidden">
            <FilterSheetTrigger activeCount={activeCount} onClick={() => setOpenFilters(true)} />
          </div>

          {/* sort */}
          <div className="relative hidden shrink-0 sm:block">
            <button
              type="button"
              onClick={() => setOpenSort((s) => !s)}
              aria-expanded={openSort}
              className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[0.75rem] text-ink-700 transition-colors hover:border-sage-400"
            >
              <ArrowUpDown className="size-3.5" strokeWidth={1.7} />
              <span className="max-w-[9rem] truncate">{sortLabel}</span>
            </button>
            {openSort && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenSort(false)} aria-hidden />
                <ul className="absolute end-0 top-12 z-20 w-48 overflow-hidden rounded-xl border border-line bg-cream-50 p-1 shadow-float">
                  {SORT_OPTIONS.map((o) => (
                    <li key={o.key}>
                      <button
                        type="button"
                        onClick={() => {
                          push({ sort: o.key as SortKey });
                          setOpenSort(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-[0.75rem] transition-colors',
                          query.sort === o.key ? 'bg-sage-100 text-sage-700' : 'text-ink-600 hover:bg-cream-200',
                        )}
                      >
                        {o.label}
                        {query.sort === o.key && <span className="size-1.5 rounded-full bg-sage-500" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
          <p className="text-[0.6875rem] text-ink-400">
            <span className="font-medium text-ink-700">{num(resultCount)}</span> محصول
          </p>
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setOpenSort(true)}
              className="flex h-7 items-center gap-1 rounded-full bg-cream-200 px-2.5 text-[0.6875rem] text-ink-600"
            >
              {sortLabel}
            </button>
          </div>
        </div>
      </div>

      {/* mobile filter sheet */}
      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} side="bottom" title="فیلتر محصولات">
        <div className="px-5 pb-4 pt-5">
          <FilterPanel query={query} base={base} resultCount={resultCount} onDone={() => setOpenFilters(false)} />
        </div>
      </Sheet>

      {/* mobile sort sheet */}
      <Sheet open={openSort} onClose={() => setOpenSort(false)} side="bottom" title="مرتب‌سازی">
        <ul className="p-3">
          {SORT_OPTIONS.map((o) => (
            <li key={o.key}>
              <button
                type="button"
                onClick={() => {
                  push({ sort: o.key as SortKey });
                  setOpenSort(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-3 text-[0.8125rem] transition-colors',
                  query.sort === o.key ? 'bg-sage-100 text-sage-700' : 'text-ink-600 hover:bg-cream-200',
                )}
              >
                {o.label}
                {query.sort === o.key && <span className="size-1.5 rounded-full bg-sage-500" />}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

export function ActiveFilterChips({ query, base }: { query: ShopQuery; base: string }) {
  const router = useRouter();
  const push = (patch: Partial<ShopQuery>) => router.push(buildHref(base, query, patch), { scroll: false });
  const chips: { label: string; onRemove: () => void }[] = [];

  query.colors.forEach((c) =>
    chips.push({ label: `رنگ: ${COLORS[c]?.name ?? c}`, onRemove: () => push({ colors: query.colors.filter((x) => x !== c) }) }),
  );
  query.sizes.forEach((s) =>
    chips.push({ label: `سایز: ${sizeLabel(s)}`, onRemove: () => push({ sizes: query.sizes.filter((x) => x !== s) }) }),
  );
  if (query.q) chips.push({ label: `«${query.q}»`, onRemove: () => push({ q: '' }) });
  if (query.audience) chips.push({ label: 'مخاطب', onRemove: () => push({ audience: null }) });

  if (!chips.length) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      {chips.map((c, i) => (
        <button
          key={`${c.label}-${i}`}
          type="button"
          onClick={c.onRemove}
          className="group flex h-7 items-center gap-1.5 rounded-full border border-sage-200 bg-sage-50 px-2.5 text-[0.6875rem] text-sage-700 transition-colors hover:bg-sage-100"
        >
          {c.label}
          <X className="size-3 opacity-60 transition-opacity group-hover:opacity-100" strokeWidth={2.4} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => push({ colors: [], sizes: [], q: '', audience: null })}
        className="text-[0.6875rem] text-ink-400 underline decoration-line underline-offset-4 hover:text-ink-700"
      >
        پاک کردن همه
      </button>
    </div>
  );
}
