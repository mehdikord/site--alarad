import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** AL-1405-4821 style tracking code */
export function trackingCode() {
  const year = 1405;
  const n = Math.floor(1000 + Math.random() * 8999);
  return `AL-${year}-${n}`;
}

export function formatCardNumber(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 16);
  return d.replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

/** stable pseudo random from a string seed — safe for SSR */
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  return Math.abs(h % 1000) / 1000;
}

export const debounce = <T extends (...args: never[]) => void>(fn: T, ms = 250) => {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
