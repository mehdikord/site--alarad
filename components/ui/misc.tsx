'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { ChevronDown, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { num } from '@/lib/format';

/* ───────────────────────── Quantity stepper ───────────────────────── */
export function QuantityStepper({
  value,
  onChange,
  max = 99,
  min = 1,
  size = 'md',
  label = 'تعداد',
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
  size?: 'sm' | 'md';
  label?: string;
}) {
  const h = size === 'sm' ? 'h-9' : 'h-11';
  const w = size === 'sm' ? 'w-8' : 'w-10';
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-line bg-white',
        h,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        aria-label="افزایش تعداد"
        className={cn(
          'flex items-center justify-center rounded-full text-ink-500 transition-colors duration-200 hover:text-ink-900 disabled:opacity-30',
          w, h,
        )}
      >
        <Plus className="size-3.5" strokeWidth={2} />
      </button>
      <span className={cn('min-w-7 text-center text-sm font-medium fa-num text-ink-900', size === 'sm' && 'text-[0.8125rem]')}>
        {num(value)}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.max(value - 1, min))}
        disabled={value <= min}
        aria-label="کاهش تعداد"
        className={cn(
          'flex items-center justify-center rounded-full text-ink-500 transition-colors duration-200 hover:text-ink-900 disabled:opacity-30',
          w, h,
        )}
      >
        <Minus className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

/* ───────────────────────────── Accordion ───────────────────────────── */
export function Accordion({
  title,
  children,
  defaultOpen = false,
  meta,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  meta?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
    return (
    <div className="border-b border-line-soft last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-start"
      >
        <span className="text-sm font-medium text-ink-900">{title}</span>
        <span className="flex items-center gap-2">
          {meta}
          <ChevronDown
            className={cn('size-4 text-ink-300 transition-transform duration-400 ease-silk', open && 'rotate-180')}
            strokeWidth={1.8}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{height: 0, opacity: 0}}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{height: 0, opacity: 0}}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5 text-[0.8125rem] leading-[1.9] text-ink-500">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────── Sheet ────────────────────────────── */
export function Sheet({
  open,
  onClose,
  children,
  side = 'end',
  title,
  className,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'end' | 'bottom' | 'start';
  title?: string;
  className?: string;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const variants = {
    end: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
    start: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
  }[side];

  const placement = {
    end: 'inset-y-0 start-0 w-[min(420px,92vw)] rounded-e-3xl',
    start: 'inset-y-0 end-0 w-[min(420px,92vw)] rounded-s-3xl',
    bottom: 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl',
  }[side];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/25 backdrop-blur-[3px]"
          />
          <motion.div
            {...variants}
            transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 0.9 }}
            className={cn(
              'absolute flex flex-col bg-cream-50 shadow-float',
              placement,
              className,
            )}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
                <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="بستن"
                  className="flex size-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-cream-200 hover:text-ink-900"
                >
                  <X className="size-4" strokeWidth={1.8} />
                </button>
              </div>
            )}
            <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', !title && 'pt-[env(safe-area-inset-top)]')}>
              {children}
            </div>
            {footer && <div className="border-t border-line-soft bg-cream-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────── Toast ─────────────────────────────── */
export function ToastHost({ toast, onDismiss }: { toast: { id: number; message: string; variant?: string } | null; onDismiss: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-[130] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink-900 px-4 py-2.5 text-[0.8125rem] text-cream-50 shadow-float"
            role="status"
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                toast.variant === 'error' ? 'bg-blush-300' : toast.variant === 'success' ? 'bg-sage-400' : 'bg-cream-300',
              )}
            />
            {toast.message}
            <button onClick={onDismiss} aria-label="بستن" className="ms-1 text-cream-300 transition-colors hover:text-white">
              <X className="size-3.5" strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────── Empty state ──────────────────────────── */
export function EmptyState({
  title,
  description,
  action,
  variant = 'bag',
  compact,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: 'bag' | 'search' | 'heart' | 'box';
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'py-12' : 'py-18 sm:py-24')}>
      <div className="relative mb-6">
        <span className="absolute inset-0 -z-10 rounded-full bg-cream-200 blur-2xl" aria-hidden />
        <svg viewBox="0 0 120 120" className="size-28 text-sage-400 sm:size-32" fill="none" aria-hidden>
          {variant === 'bag' && (
            <>
              <path d="M32 44h56l-5 44a8 8 0 0 1-8 7H45a8 8 0 0 1-8-7l-5-44Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M47 44V34a13 13 0 0 1 26 0v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="60" cy="72" r="3" fill="currentColor" opacity=".5" />
            </>
          )}
          {variant === 'search' && (
            <>
              <circle cx="55" cy="55" r="24" stroke="currentColor" strokeWidth="1.6" />
              <path d="m73 73 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M44 55h22M55 44v22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".55" />
            </>
          )}
          {variant === 'heart' && (
            <path
              d="M60 84S30 68 30 50a16 16 0 0 1 30-7 16 16 0 0 1 30 7c0 18-30 34-30 34Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          )}
          {variant === 'box' && (
            <>
              <path d="M30 48 60 32l30 16v34L60 98 30 82V48Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M30 48l30 16 30-16M60 64v34" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </>
          )}
        </svg>
      </div>
      <h3 className="text-h3 text-ink-900">{title}</h3>
      <p className="mt-2 max-w-[34ch] text-[0.8125rem] leading-[1.9] text-ink-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ─────────────────────────────── Skeletons ─────────────────────────────── */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton aspect-[4/5] rounded-lg" />
      <div className="space-y-2 px-1">
        <div className="skeleton h-3.5 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
        <div className="skeleton h-3.5 w-1/3 rounded-full" />
      </div>
    </div>
  );
}

/* ────────────────────────────── Rating stars ────────────────────────────── */
export function Stars({ rating, size = 13, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} dir="ltr" aria-label={`امتیاز ${rating} از ۵`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i + 1));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
            <defs>
              <linearGradient id={`s${i}-${Math.round(rating * 10)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#8FA08C" />
                <stop offset={`${fill * 100}%`} stopColor="#E9DFD5" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.47 5.1 5.6.77-4.09 3.9 1 5.55L10 14.24l-4.98 2.68 1-5.55L1.93 7.47l5.6-.77L10 1.6z"
              fill={`url(#s${i}-${Math.round(rating * 10)})`}
            />
          </svg>
        );
      })}
    </span>
  );
}

/* ───────────────────────── Section header ───────────────────────── */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = 'start',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h2 className="text-h2 sm:text-h1 text-ink-900">{title}</h2>
        {description && <p className="mt-2 text-[0.8125rem] leading-[1.9] text-ink-500 sm:text-sm">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
