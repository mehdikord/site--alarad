'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'peer h-[52px] w-full rounded-xl border bg-cream-100/70 px-4 text-sm text-ink-900 placeholder:text-transparent ' +
  'transition-all duration-300 ease-silk outline-none ' +
  'border-line hover:border-cream-400 ' +
  'focus:border-sage-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(168,181,162,.18)]';

const labelBase =
  'pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-sm text-ink-400 transition-all duration-200 ease-silk ' +
  'peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[0.6875rem] peer-focus:text-sage-600 ' +
  'peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[0.6875rem]';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; ltr?: boolean; prefix?: React.ReactNode }
>(function Input({ label, error, hint, className, id, ltr, prefix, ...props }, ref) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            fieldBase,
            'pt-5',
            ltr && 'ltr-num',
            prefix ? 'ps-12' : undefined,
            error && 'border-blush-300 focus:border-blush-500 focus:shadow-[0_0_0_4px_rgba(233,210,203,.35)]',
            className,
          )}
          {...props}
        />
        <label htmlFor={inputId} className={labelBase}>
          {label}
        </label>
        {prefix && <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-400">{prefix}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 ps-1 text-[0.75rem] text-blush-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 ps-1 text-[0.75rem] text-ink-300">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }
>(function Textarea({ label, error, className, id, ...props }, ref) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          ref={ref}
          id={inputId}
          placeholder=" "
          rows={3}
          className={cn(
            fieldBase,
            'h-auto min-h-[104px] resize-none py-4 pt-6 leading-7',
            error && 'border-blush-300',
            className,
          )}
          {...props}
        />
        <label htmlFor={inputId} className={labelBase}>
          {label}
        </label>
      </div>
      {error && <p className="mt-1.5 ps-1 text-[0.75rem] text-blush-500">{error}</p>}
    </div>
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; options: { value: string; label: string }[] }
>(function Select({ label, error, options, className, id, ...props }, ref) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            fieldBase,
            'cursor-pointer appearance-none pt-5 pb-1 text-sm',
            !props.value && 'text-ink-400',
            error && 'border-blush-300',
            className,
          )}
          {...props}
        >
          <option value="" disabled hidden />
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-ink-900">
              {o.label}
            </option>
          ))}
        </select>
        <label
          htmlFor={inputId}
          className="pointer-events-none absolute start-4 top-2.5 text-[0.6875rem] text-sage-600"
        >
          {label}
        </label>
        <svg
          className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-ink-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && <p className="mt-1.5 ps-1 text-[0.75rem] text-blush-500">{error}</p>}
    </div>
  );
});

export function Checkbox({
  checked,
  onChange,
  children,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  id?: string;
}) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className="flex cursor-pointer select-none items-start gap-2.5 text-[0.8125rem] text-ink-700">
      <span className="relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-[18px] appearance-none rounded-[6px] border border-cream-400 bg-cream-100 transition-colors duration-200 checked:border-sage-500 checked:bg-sage-500"
        />
        <svg
          className="pointer-events-none absolute size-3 scale-75 text-white opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}

export function RadioCard({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group relative w-full rounded-2xl border p-4 text-start transition-all duration-300 ease-silk',
        active
          ? 'border-sage-400 bg-sage-50 shadow-[0_0_0_3px_rgba(168,181,162,.15)]'
          : 'border-line bg-white hover:border-cream-400 hover:bg-cream-50',
        className,
      )}
    >
      {children}
      <span
        className={cn(
          'absolute end-4 top-4 flex size-[18px] items-center justify-center rounded-full border transition-all duration-300',
          active ? 'border-sage-500 bg-sage-500' : 'border-cream-400 bg-white',
        )}
      >
        <span className={cn('size-1.5 rounded-full bg-white transition-opacity', active ? 'opacity-100' : 'opacity-0')} />
      </span>
    </button>
  );
}
