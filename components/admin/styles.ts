import { cn } from '@/lib/utils';

/* Server-safe class helpers for the admin panel (usable from server and client components). */

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-[0.8125rem] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2';

export const adminBtn = (variant: 'primary' | 'outline' | 'ghost' | 'danger' | 'sage' = 'primary', size: 'sm' | 'md' = 'md') =>
  cn(
    btnBase,
    size === 'sm' ? 'h-8 px-3 text-[0.75rem]' : 'h-10 px-4',
    variant === 'primary' && 'bg-ink-900 text-cream-50 hover:bg-ink-800',
    variant === 'sage' && 'bg-sage-600 text-white hover:bg-sage-700',
    variant === 'outline' && 'border border-line bg-white text-ink-700 hover:border-sage-400 hover:text-ink-900',
    variant === 'ghost' && 'text-ink-500 hover:bg-cream-200 hover:text-ink-900',
    variant === 'danger' && 'border border-blush-300 bg-white text-blush-500 hover:bg-blush-100',
  );

export const adminInput =
  'h-10 w-full rounded-lg border border-line bg-white px-3 text-[0.8125rem] text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-sage-400 focus:shadow-[0_0_0_3px_rgba(168,181,162,.18)] disabled:bg-cream-100';
