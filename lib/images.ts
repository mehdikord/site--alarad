import manifest from '@/public/images/manifest.json';

type Entry = { w: number; h: number; blur: string };
const M = manifest as Record<string, Entry>;

/** Bundled editorial assets (hero, stories…) stored in /public/images. */
export const asset = (key: string) => `/images/${key}.webp`;
export const blurOf = (key: string) => M[key]?.blur ?? M['hero']?.blur ?? '';

/** neutral placeholder for products without photos */
export const PLACEHOLDER_BLUR = M['hero']?.blur ?? '';
