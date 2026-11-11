import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const RAW = '_raw';
const OUT = 'public/images';

/** Crop definitions: every product shot is a 4:5 portrait crop from one of the source photos. */
const CROPS = {
  // --- source: p-socks-cream (single cream ankle sock on plaster block)
  'sock-ankle': { src: 'p-socks-cream.png', crop: { left: 285, top: 70, width: 720, height: 900 } },
  'sock-ankle-detail': { src: 'p-socks-cream.png', crop: { left: 380, top: 230, width: 520, height: 650 } },
  'sock-ankle-alt': { src: 'p-socks-cream.png', crop: { left: 150, top: 30, width: 1000, height: 1250 } },

  // --- source: p-tights-nude (rolled tights + kraft box)
  'tights-roll': { src: 'p-tights-nude.png', crop: { left: 430, top: 300, width: 800, height: 1000 } },
  'tights-box': { src: 'p-tights-nude.png', crop: { left: 90, top: 150, width: 700, height: 875 } },
  'tights-drape': { src: 'p-tights-nude.png', crop: { left: 200, top: 480, width: 800, height: 1000 } },
  'tights-alt': { src: 'p-tights-nude.png', crop: { left: 0, top: 0, width: 1254, height: 1567 } },

  // --- source: p-scrunchie (silk scrunchies on pedestal)
  'scrunchie': { src: 'p-scrunchie.png', crop: { left: 200, top: 420, width: 840, height: 1050 } },
  'scrunchie-detail': { src: 'p-scrunchie.png', crop: { left: 250, top: 470, width: 600, height: 750 } },
  'scrunchie-alt': { src: 'p-scrunchie.png', crop: { left: 0, top: 200, width: 1000, height: 1250 } },

  // --- source: cat-socks (grid of folded ankle socks)
  'socks-grid': { src: 'cat-socks.png', crop: { left: 0, top: 0, width: 1122, height: 1402 } },
  'socks-row': { src: 'cat-socks.png', crop: { left: 80, top: 850, width: 960, height: 1200 } },
  'socks-single': { src: 'cat-socks.png', crop: { left: 620, top: 60, width: 440, height: 550 } },
  'socks-pair': { src: 'cat-socks.png', crop: { left: 120, top: 240, width: 700, height: 875 } },

  // --- source: cat-tights (sheer tights + sage ribbon)
  'tights-flat': { src: 'cat-tights.png', crop: { left: 0, top: 0, width: 1122, height: 1402 } },
  'tights-flat-detail': { src: 'cat-tights.png', crop: { left: 420, top: 620, width: 620, height: 775 } },

  // --- source: cat-hair (scrunchie, pearl clip, sage tie)
  'hair-flat': { src: 'cat-hair.png', crop: { left: 20, top: 120, width: 1040, height: 1300 } },
  'hair-clip': { src: 'cat-hair.png', crop: { left: 600, top: 440, width: 466, height: 582 } },
  'hair-tie': { src: 'cat-hair.png', crop: { left: 330, top: 800, width: 500, height: 625 } },
  'hair-scrunchie': { src: 'cat-hair.png', crop: { left: 40, top: 240, width: 620, height: 775 } },

  // --- source: cat-underwear (folded cotton briefs stack)
  'briefs-stack': { src: 'cat-underwear.png', crop: { left: 200, top: 300, width: 800, height: 1000 } },
  'briefs-detail': { src: 'cat-underwear.png', crop: { left: 300, top: 380, width: 620, height: 775 } },
  'briefs-alt': { src: 'cat-underwear.png', crop: { left: 0, top: 100, width: 1000, height: 1250 } },

  // --- source: hero (folded knits, pearl clip, ribbon)
  'folded': { src: 'hero.png', crop: { left: 150, top: 300, width: 640, height: 800 } },
  'folded-alt': { src: 'hero.png', crop: { left: 40, top: 380, width: 800, height: 1000 } },
  'pearl': { src: 'hero.png', crop: { left: 90, top: 660, width: 420, height: 525 } },
  'ribbon': { src: 'hero.png', crop: { left: 0, top: 600, width: 560, height: 700 } },

  // --- editorial / hero / category
  'hero': { src: 'hero.png', crop: null },
  'cat-socks': { src: 'cat-socks.png', crop: null },
  'cat-tights': { src: 'cat-tights.png', crop: null },
  'cat-hair': { src: 'cat-hair.png', crop: null },
  'cat-underwear': { src: 'cat-underwear.png', crop: null },
};

/** Wide editorial banners (16:9-ish). */
const WIDE = {
  'editorial-wide': { src: 'hero.png', crop: { left: 0, top: 620, width: 1122, height: 631 } },
  'editorial-tights': { src: 'cat-tights.png', crop: { left: 0, top: 680, width: 1122, height: 631 } },
  'editorial-hair': { src: 'cat-hair.png', crop: { left: 0, top: 400, width: 1086, height: 611 } },
};

/** Square crops for the lookbook strip. */
const SQUARES = {
  'story-folded': { src: 'hero.png', crop: { left: 120, top: 320, width: 700, height: 700 } },
  'story-ribbon': { src: 'hero.png', crop: { left: 0, top: 620, width: 620, height: 620 } },
  'story-socks': { src: 'cat-socks.png', crop: { left: 100, top: 150, width: 900, height: 900 } },
  'story-tights': { src: 'cat-tights.png', crop: { left: 220, top: 300, width: 820, height: 820 } },
  'story-hair': { src: 'cat-hair.png', crop: { left: 60, top: 240, width: 960, height: 960 } },
  'story-briefs': { src: 'cat-underwear.png', crop: { left: 200, top: 330, width: 900, height: 900 } },
};

/** Colour → sharp modulate ops. Cream is the neutral baseline (no tint). */
const TINTS = {
  cream: null,
  oat: { hue: 12, saturation: 1.18, brightness: 0.93 },
  sage: { hue: 72, saturation: 0.55, brightness: 0.97 },
  charcoal: { saturation: 0.30, brightness: 0.74 },
  dove: { hue: 200, saturation: 0.42, brightness: 1.0 },
  blush: { hue: -18, saturation: 0.78, brightness: 1.02 },
  navy: { hue: 214, saturation: 0.40, brightness: 0.68 },
  black: { saturation: 0.14, brightness: 0.66 },
  rose: { hue: -24, saturation: 1.0, brightness: 0.94 },
};

async function make({ src, crop }, tint, { width = 1200, height = 1500, quality = 80 } = {}) {
  let img = sharp(path.join(RAW, src));
  if (crop) {
    const meta = await img.metadata();
    const c = {
      left: Math.max(0, Math.round(crop.left)),
      top: Math.max(0, Math.round(crop.top)),
      width: Math.min(Math.round(crop.width), meta.width - Math.round(crop.left)),
      height: Math.min(Math.round(crop.height), meta.height - Math.round(crop.top)),
    };
    img = img.extract(c);
  }
  if (tint) img = img.modulate(tint);
  const buf = await img
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .webp({ quality, effort: 5 })
    .toBuffer();
  const blur = await sharp(buf).resize(14).webp({ quality: 45 }).toBuffer();
  return { buf, blur: `data:image/webp;base64,${blur.toString('base64')}` };
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const manifest = {};
  const used = new Set();

  // full-bleed hero / category tiles — single neutral version
  const SINGLES = { hero: TINTS.cream, 'cat-socks': TINTS.cream, 'cat-tights': TINTS.cream, 'cat-hair': TINTS.cream, 'cat-underwear': TINTS.cream };
  for (const [key, tint] of Object.entries(SINGLES)) {
    const { buf, blur } = await make(CROPS[key], tint);
    await fs.writeFile(path.join(OUT, `${key}.webp`), buf);
    manifest[key] = { w: 1200, h: 1500, blur };
    used.add(key);
  }

  // product shots × colours (cream == neutral, no tint)
  let n = 0;
  for (const [cropKey, def] of Object.entries(CROPS)) {
    if (SINGLES[cropKey] !== undefined) continue;
    for (const [colorKey, tint] of Object.entries(TINTS)) {
      const key = `${cropKey}__${colorKey}`;
      const { buf, blur } = await make(def, tint);
      await fs.writeFile(path.join(OUT, `${key}.webp`), buf);
      manifest[key] = { w: 1200, h: 1500, blur };
      used.add(key);
      n++;
    }
  }

  // lookbook squares
  for (const [key, def] of Object.entries(SQUARES)) {
    const { buf, blur } = await make(def, null, { width: 900, height: 900, quality: 78 });
    await fs.writeFile(path.join(OUT, `${key}.webp`), buf);
    manifest[key] = { w: 900, h: 900, blur };
    used.add(key);
  }

  // wide editorial bands
  for (const [key, def] of Object.entries(WIDE)) {
    let img = sharp(path.join(RAW, def.src)).extract(def.crop);
    const buf = await img.resize(1600, 900, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
    const blur = await sharp(buf).resize(16).webp({ quality: 40 }).toBuffer();
    await fs.writeFile(path.join(OUT, `${key}.webp`), buf);
    manifest[key] = { w: 1600, h: 900, blur: `data:image/webp;base64,${blur.toString('base64')}` };
  }

  // og image (1200x630 editorial crop)
  const og = await sharp(path.join(RAW, 'hero.png'))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88 })
    .toBuffer();
  await fs.writeFile('public/og.jpg', og);

  await fs.writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
  const files = await fs.readdir(OUT);
  const size = (await Promise.all(files.map(async (f) => (await fs.stat(path.join(OUT, f))).size))).reduce((a, b) => a + b, 0);
  console.log(`generated ${n} tinted shots + singles + squares → ${files.length} files, ${(size / 1e6).toFixed(1)} MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
