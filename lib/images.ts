import manifest from '@/public/images/manifest.json';

type Entry = { w: number; h: number; blur: string };
const M = manifest as Record<string, Entry>;

/** Editorial / category assets are stored without a colour suffix. */
export const asset = (key: string) => `/images/${key}.webp`;
export const blurOf = (key: string) => M[key]?.blur ?? M['hero']?.blur ?? '';

/** A product shot tinted for the selected colour (falls back to cream). */
export function shot(key: string, color?: string) {
  if (!color) return { src: asset(key), blur: blurOf(key) };
  const tinted = `${key}__${color}`;
  if (M[tinted]) return { src: asset(tinted), blur: M[tinted].blur };
  const cream = `${key}__cream`;
  return M[cream] ? { src: asset(cream), blur: M[cream].blur } : { src: asset(key), blur: blurOf(key) };
}

/** All gallery images for a product in a given colour. */
export function gallery(shots: string[], color: string) {
  return shots.map((s, i) => ({ ...shot(s, color), key: `${s}-${color}-${i}` }));
}

export function productCardImage(shots: string[], color: string) {
  return shot(shots[0], color);
}
