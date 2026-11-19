import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* Server-safe table + list primitives for the admin panel. */

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-line-soft bg-white', className)}>
      <table className="w-full min-w-[640px] text-[0.8125rem]">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-line-soft bg-cream-100/70 text-start text-[0.6875rem] text-ink-400">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-3 py-2.5 text-start font-medium', className)}>{children}</th>;
}

export function Td({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn('px-3 py-2.5 align-middle text-ink-700', className)}>
      {children}
    </td>
  );
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('border-b border-line-soft last:border-0 hover:bg-cream-50/80', className)}>{children}</tr>;
}

export function EmptyRow({ colSpan, children = 'موردی یافت نشد.' }: { colSpan: number; children?: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12 text-center text-[0.8125rem] text-ink-400">
        {children}
      </td>
    </tr>
  );
}

export function Badge({ children, tone = 'bg-cream-200 text-ink-600', className }: { children: React.ReactNode; tone?: string; className?: string }) {
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.6875rem] font-medium', tone, className)}>{children}</span>;
}

/** builds `?page=` links that keep the other search params */
export function Pagination({
  page,
  pages,
  total,
  basePath,
  params,
}: {
  page: number;
  pages: number;
  total?: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return total !== undefined ? <p className="mt-3 text-[0.6875rem] text-ink-400">{fa(total)} مورد</p> : null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') sp.set(k, v);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const window = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {total !== undefined && <p className="text-[0.6875rem] text-ink-400">{fa(total)} مورد · صفحهٔ {fa(page)} از {fa(pages)}</p>}
      <nav className="flex items-center gap-1" aria-label="صفحه‌بندی">
        <PageLink href={href(Math.max(1, page - 1))} disabled={page <= 1} aria-label="قبلی">
          <ChevronRight className="size-3.5" />
        </PageLink>
        {window.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            {i > 0 && window[i - 1] !== p - 1 && <span className="px-1 text-ink-300">…</span>}
            <PageLink href={href(p)} active={p === page}>
              {fa(p)}
            </PageLink>
          </span>
        ))}
        <PageLink href={href(Math.min(pages, page + 1))} disabled={page >= pages} aria-label="بعدی">
          <ChevronLeft className="size-3.5" />
        </PageLink>
      </nav>
    </div>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      {...rest}
      className={cn(
        'flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-[0.75rem] transition-colors',
        active ? 'border-ink-900 bg-ink-900 text-cream-50' : 'border-line bg-white text-ink-600 hover:border-sage-400',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </Link>
  );
}

/** horizontal filter tabs (server links) */
export function FilterTabs({
  items,
  active,
}: {
  items: { href: string; label: string; count?: number; value: string }[];
  active: string;
}) {
  return (
    <div className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
      {items.map((it) => (
        <Link
          key={it.value}
          href={it.href}
          className={cn(
            'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.75rem] transition-colors',
            active === it.value ? 'border-ink-900 bg-ink-900 text-cream-50' : 'border-line bg-white text-ink-600 hover:border-sage-400',
          )}
        >
          {it.label}
          {it.count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-[0.625rem]', active === it.value ? 'bg-white/15' : 'bg-cream-200 text-ink-500')}>
              {fa(it.count)}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

/** GET search form (no JS needed) */
export function SearchBar({
  action,
  placeholder = 'جست‌وجو…',
  defaultValue,
  hidden,
  children,
}: {
  action: string;
  placeholder?: string;
  defaultValue?: string;
  hidden?: Record<string, string | undefined>;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} method="get" className="mb-4 flex flex-wrap items-center gap-2">
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-[0.8125rem] outline-none focus:border-sage-400 sm:max-w-sm"
      />
      {children}
      <button className="h-10 rounded-lg bg-ink-900 px-4 text-[0.8125rem] text-cream-50 hover:bg-ink-800">جست‌وجو</button>
    </form>
  );
}

const faFmt = new Intl.NumberFormat('fa-IR');
export const fa = (n: number) => faFmt.format(n);

/** page helper: ?page= → { page, skip, take } */
export function paging(raw: string | undefined, perPage = 20) {
  const page = Math.max(1, Number(raw) || 1);
  return { page, skip: (page - 1) * perPage, take: perPage };
}
