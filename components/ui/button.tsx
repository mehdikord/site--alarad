'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'sage' | 'outline' | 'ghost' | 'soft' | 'blush';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'relative inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap ' +
  'transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-silk ' +
  'disabled:pointer-events-none disabled:opacity-45';

const variants: Record<Variant, string> = {
  primary:
    'bg-ink-900 text-cream-50 hover:bg-ink-800 shadow-[0_10px_24px_-14px_rgba(48,44,41,.55)] hover:shadow-[0_18px_34px_-16px_rgba(48,44,41,.45)]',
  sage:
    'bg-sage-500 text-white hover:bg-sage-600 shadow-[0_10px_24px_-14px_rgba(113,129,107,.7)] hover:shadow-[0_18px_34px_-16px_rgba(113,129,107,.55)]',
  outline: 'border border-line bg-transparent text-ink-900 hover:border-sage-400 hover:bg-sage-50',
  ghost: 'text-ink-700 hover:bg-cream-200/80',
  soft: 'bg-cream-200 text-ink-900 hover:bg-cream-300/90',
  blush: 'bg-blush-200 text-ink-900 hover:bg-blush-300/80',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 rounded-[10px] px-4 text-[0.8125rem]',
  md: 'h-11 rounded-xl px-5 text-sm',
  lg: 'h-[52px] rounded-2xl px-7 text-[0.9375rem]',
  icon: 'h-11 w-11 rounded-full',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const buttonClass = ({ variant = 'primary', size = 'md', full, className }: CommonProps) =>
  cn(base, variants[variant], sizes[size], full && 'w-full', className);

type ButtonProps = CommonProps & HTMLMotionProps<'button'>;

export function Button({ variant, size, loading, full, className, children, disabled, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.985 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={buttonClass({ variant, size, full, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      <span className={cn('inline-flex items-center gap-2', loading && 'opacity-80')}>{children}</span>
    </motion.button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  full,
  className,
  children,
  prefetch,
  onClick,
  target,
}: CommonProps & {
  href: string;
  prefetch?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  target?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={onClick}
      target={target}
      className={buttonClass({ variant, size, full, className })}
    >
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-[1.5px] border-current border-t-transparent opacity-70',
        className,
      )}
      aria-hidden
    />
  );
}
