'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { COLORS } from '@/lib/data/taxonomy';
import { PRICE_BOUNDS } from '@/lib/data/products';
import { money, num, toLatinDigits } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  COLOR_FILTERS,
  SIZE_FILTERS,
  FILTER_SIZE_LABEL,
  AUDIENCE_LABELS,
  buildHref,
  type ShopQuery,
} from '@/lib/shop';

/** Multi-select colour swatches */
function ColorFilter({ selected, onToggle }: { selected: string[]; onToggle: (c: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {COLOR_FILTERS.map((key) => {
        const c = COLORS[key];
        const active = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            aria-pressed={active}
            className={cn(
              'group flex items-center gap-2 rounded-xl border px-2 py-2 text-start transition-all duration-300 ease-silk',
              active ? 'border-sage-400 bg-sage-50' : 'border-line bg-white hover:border-cream-400',
            )}
          >
            <span className="relative flex size-5 shrink-0 items-center justify-center rounded-full border border-white shadow-[0_1px_3px_rgba(58,50,44,.18)]">
              <span className="absolute inset-0 rounded-full" style={{ backgroundImage: c.swatch }} />
              {active && <Check className="relative size-3 text-ink-900/80" strokeWidth={3} />}
            </span>
            <span className={cn('truncate text-[0.6875rem]', active ? 'text-ink-900' : 'text-ink-500')}>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SizeFilter({ selected, onToggle }: { selected: string[]; onToggle: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SIZE_FILTERS.map((key) => {
        const active = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            aria-pressed={active}
            className={cn(
              'h-9 min-w-[46px] rounded-full border px-3 text-[0.75rem] transition-all duration-300 ease-silk',
              active
                ? 'border-ink-900 bg-ink-900 text-cream-50'
                : 'border-line bg-white text-ink-600 hover:border-sage-400',
            )}
          >
            {FILTER_SIZE_LABEL(key)}
          </button>
        );
      })}
    </div>
  );
}

/** Dual price range using two native sliders (fully accessible, no heavy lib). */
function PriceFilter({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const step = 10_000;
  const [lo, setLo] = React.useState(min);
  const [hi, setHi] = React.useState(max);

  React.useEffect(() => {
    setLo(min);
    setHi(max);
  }, [min, max]);

  const commit = (a: number, b: number) => onChange(Math.min(a, b), Math.max(a, b));
  const pct = (v: number) => ((v - PRICE_BOUNDS.min) / (PRICE_BOUNDS.max - PRICE_BOUNDS.min)) * 100;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[0.75rem] text-ink-600">
        <span className="rounded-lg bg-cream-200/80 px-2 py-1 fa-num">{money(lo)}</span>
        <span className="text-ink-300">تا</span>
        <span className="rounded-lg bg-cream-200/80 px-2 py-1 fa-num">{money(hi)}</span>
      </div>
      <div className="relative h-9">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-cream-300" />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-sage-400"
          style={{ right: `${pct(lo)}%`, left: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={step}
          value={lo}
          aria-label="حداقل قیمت"
          onChange={(e) => setLo(Math.min(+e.target.value, hi - step))}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sage-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
        />
        <input
          type="range"
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={step}
          value={hi}
          aria-label="حداکثر قیمت"
          onChange={(e) => setHi(Math.max(+e.target.value, lo + step))}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sage-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>
      <div className="mt-1 flex justify-between text-[0.625rem] text-ink-300">
        <span>{money(PRICE_BOUNDS.min)}</span>
        <span>{money(PRICE_BOUNDS.max)}</span>
      </div>
    </div>
  );
}

export function FilterPanel({
  query,
  base,
  resultCount,
  onDone,
}: {
  query: ShopQuery;
  base: string;
  resultCount: number;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const push = (patch: Partial<ShopQuery>) => {
    const href = buildHref(base, query, patch);
    startTransition(() => router.push(href, { scroll: false }));
  };

  const toggle = (key: 'colors' | 'sizes', value: string) => {
    const current = query[key];
    push({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] } as Partial<ShopQuery>);
  };

  const activeCount =
    query.colors.length + query.sizes.length + (query.min > PRICE_BOUNDS.min || query.max < PRICE_BOUNDS.max ? 1 : 0) + (query.audience ? 1 : 0);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <p className="text-[0.8125rem] font-medium text-ink-900">فیلترها</p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => push({ colors: [], sizes: [], min: PRICE_BOUNDS.min, max: PRICE_BOUNDS.max, audience: null })}
            className="text-[0.6875rem] text-sage-700 underline decoration-sage-300 underline-offset-4 hover:text-sage-600"
          >
            پاک کردن ({num(activeCount)})
          </button>
        )}
      </div>

      <section>
        <h3 className="mb-2.5 text-[0.75rem] font-medium text-ink-700">مخاطب</h3>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => push({ audience: query.audience === key ? null : (key as ShopQuery['audience']) })}
              aria-pressed={query.audience === key}
              className={cn(
                'h-8 rounded-full border px-3 text-[0.6875rem] transition-colors duration-300',
                query.audience === key
                  ? 'border-ink-900 bg-ink-900 text-cream-50'
                  : 'border-line bg-white text-ink-600 hover:border-sage-400',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 text-[0.75rem] font-medium text-ink-700">رنگ</h3>
        <ColorFilter selected={query.colors} onToggle={(c) => toggle('colors', c)} />
      </section>

      <section>
        <h3 className="mb-2.5 text-[0.75rem] font-medium text-ink-700">سایز</h3>
        <SizeFilter selected={query.sizes} onToggle={(s) => toggle('sizes', s)} />
      </section>

      <section>
        <h3 className="mb-2.5 text-[0.75rem] font-medium text-ink-700">محدودهٔ قیمت (تومان)</h3>
        <PriceFilter min={query.min} max={query.max} onChange={(min, max) => push({ min, max })} />
      </section>

      {onDone && (
        <button
          type="button"
          onClick={onDone}
          className="sticky bottom-0 -mx-1 mt-2 h-12 rounded-xl bg-ink-900 text-[0.875rem] font-medium text-cream-50"
        >
          {pending ? 'به‌روزرسانی…' : `نمایش ${num(resultCount)} محصول`}
        </button>
      )}
    </div>
  );
}

/** Mobile sticky trigger + sheet */
export function FilterSheetTrigger({ activeCount, onClick }: { activeCount: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[0.75rem] text-ink-700 transition-colors hover:border-sage-400"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
      </svg>
      فیلتر
      {activeCount > 0 && (
        <span className="flex size-4 items-center justify-center rounded-full bg-sage-500 text-[0.5625rem] text-white">
          {num(activeCount)}
        </span>
      )}
    </button>
  );
}

export { toLatinDigits };
