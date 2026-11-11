'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  hint,
  trend,
  icon,
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; up?: boolean };
  icon?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-line-soft bg-white p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] text-ink-400">{label}</p>
        {icon && <span className="flex size-7 items-center justify-center rounded-lg bg-cream-100 text-sage-600">{icon}</span>}
      </div>
      <p className="mt-1.5 text-[1.25rem] font-semibold text-ink-900">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span className={cn('text-[0.625rem]', trend.up ? 'text-sage-700' : 'text-blush-500')}>
            {trend.up ? '▲' : '▼'} {trend.value}
          </span>
        )}
        {hint && <span className="text-[0.625rem] text-ink-300">{hint}</span>}
      </div>
    </motion.div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  description,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-line-soft bg-white', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-4 py-3">
        <div>
          <h2 className="text-[0.8125rem] font-semibold text-ink-900">{title}</h2>
          {description && <p className="mt-0.5 text-[0.625rem] text-ink-400">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Simple, dependency-free bar chart — calm sage bars with soft grid. */
export function BarChart({ data, height = 140 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }} dir="rtl">
      {data.map((d, i) => (
        <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[0.5625rem] text-ink-300 opacity-0 transition-opacity group-hover:opacity-100">
            {new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(d.value)}
          </span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 100}%` }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'w-full max-w-9 rounded-t-md transition-colors',
              i === data.length - 1 ? 'bg-sage-500' : 'bg-sage-300/70 group-hover:bg-sage-400',
            )}
          />
          <span className="text-[0.5625rem] text-ink-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 30 - ((p - min) / (max - min || 1)) * 26;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={`${d} L100,32 L0,32 Z`} fill="url(#spark)" opacity="0.18" />
      <path d={d} fill="none" stroke="#8FA08C" strokeWidth="1.6" strokeLinecap="round" />
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8FA08C" />
          <stop offset="100%" stopColor="#8FA08C" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function StockPill({ stock }: { stock: number }) {
  const tone =
    stock <= 0 ? 'bg-cream-300 text-ink-500' : stock <= 5 ? 'bg-blush-100 text-blush-500' : 'bg-sage-100 text-sage-700';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-medium', tone)}>
      <span className={cn('size-1 rounded-full', stock <= 0 ? 'bg-ink-300' : stock <= 5 ? 'bg-blush-500' : 'bg-sage-500')} />
      {new Intl.NumberFormat('fa-IR').format(stock)}
    </span>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[1.125rem] font-semibold text-ink-900">{title}</h1>
        {description && <p className="mt-0.5 text-[0.75rem] text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
