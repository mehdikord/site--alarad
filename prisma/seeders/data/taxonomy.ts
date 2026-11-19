/** Seed taxonomy — colours, size sets and tags of the original catalogue. */
export const COLORS = [
  { key: 'cream', name: 'کرم', hex: '#F1E7DA', swatch: 'linear-gradient(145deg,#FBF5EC,#EEE0CF)' },
  { key: 'oat', name: 'شیری', hex: '#E3D5C3', swatch: 'linear-gradient(145deg,#EDE2D2,#D8C6AE)' },
  { key: 'sage', name: 'سبز مریم‌گلی', hex: '#B9C4AF', swatch: 'linear-gradient(145deg,#C9D2BF,#A2B096)' },
  { key: 'blush', name: 'صورتی پودری', hex: '#EBD3CB', swatch: 'linear-gradient(145deg,#F5E2DA,#E2C5BA)' },
  { key: 'rose', name: 'گلبهی', hex: '#D9B3A8', swatch: 'linear-gradient(145deg,#E7C6BB,#CBA396)' },
  { key: 'dove', name: 'طوسی روشن', hex: '#CFCAC4', swatch: 'linear-gradient(145deg,#DCD7D1,#BFB8B0)' },
  { key: 'charcoal', name: 'زغالی', hex: '#4A443F', swatch: 'linear-gradient(145deg,#5A534D,#38332F)' },
  { key: 'black', name: 'مشکی', hex: '#2C2825', swatch: 'linear-gradient(145deg,#3A3532,#211E1C)' },
  { key: 'navy', name: 'سرمه‌ای', hex: '#3E4653', swatch: 'linear-gradient(145deg,#4A5462,#313945)' },
];

export const SIZE_GROUPS: Record<string, { label: string; sizes: { key: string; label: string; note?: string }[] }> = {
  sock: {
    label: 'جوراب بزرگسال',
    sizes: [
      { key: 'festival', label: '۳۶ – ۴۰', note: 'مناسب سایز پای ۳۶ تا ۴۰' },
      { key: 'standard', label: '۴۰ – ۴۴', note: 'مناسب سایز پای ۴۰ تا ۴۴' },
    ],
  },
  kids: {
    label: 'کودکان',
    sizes: [
      { key: 'kids-s', label: '۱ – ۳ سال' },
      { key: 'kids-m', label: '۴ – ۶ سال' },
      { key: 'kids-l', label: '۷ – ۱۰ سال' },
    ],
  },
  tights: {
    label: 'جوراب‌شلواری',
    sizes: [
      { key: 's', label: 'S', note: 'قد ۱۵۰ تا ۱۶۰ سانتی‌متر' },
      { key: 'm', label: 'M', note: 'قد ۱۶۰ تا ۱۷۰ سانتی‌متر' },
      { key: 'l', label: 'L', note: 'قد ۱۷۰ تا ۱۸۰ سانتی‌متر' },
      { key: 'xl', label: 'XL', note: 'قد بالای ۱۸۰ سانتی‌متر' },
    ],
  },
  briefs: {
    label: 'شورت زنانه',
    sizes: [
      { key: 's', label: 'S', note: 'دور باسن ۸۶ تا ۹۲' },
      { key: 'm', label: 'M', note: 'دور باسن ۹۲ تا ۹۸' },
      { key: 'l', label: 'L', note: 'دور باسن ۹۸ تا ۱۰۶' },
      { key: 'xl', label: 'XL', note: 'دور باسن ۱۰۶ تا ۱۱۴' },
    ],
  },
  boxer: {
    label: 'شورت مردانه',
    sizes: [
      { key: 'm', label: 'M', note: 'دور کمر ۷۶ تا ۸۴' },
      { key: 'l', label: 'L', note: 'دور کمر ۸۴ تا ۹۲' },
      { key: 'xl', label: 'XL', note: 'دور کمر ۹۲ تا ۱۰۰' },
      { key: 'xxl', label: 'XXL', note: 'دور کمر ۱۰۰ تا ۱۰۸' },
    ],
  },
  hair: { label: 'اکسسوری', sizes: [{ key: 'one', label: 'یک اندازه' }] },
};

export const TAGS: Record<string, string> = {
  new: 'تازه‌ها',
  bestseller: 'پرفروش‌ها',
  recommended: 'پیشنهاد الاردشاپ',
  gift: 'هدیه',
  winter: 'کالکشن زمستان',
  cotton: 'نخی',
  sheer: 'شفاف',
};

/** nested sub-categories + which seeded product belongs to which leaf */
export const SUBCATEGORIES: Record<string, { slug: string; name: string; tagline?: string; products: string[] }[]> = {
  socks: [
    { slug: 'socks-ankle', name: 'ساق کوتاه و مچی', tagline: 'سبک، نخی، روزمره', products: ['saq-kootah-penbe-masri', 'jorab-machi-pack3', 'jorab-varzeshi-kootah', 'jorab-katan-tabestani'] },
    { slug: 'socks-long', name: 'نیم‌ساق و ساق بلند', tagline: 'گرما و پوشش بیشتر', products: ['jorab-saq-boland-keshbaf', 'jorab-baft-zemestani', 'jorab-nimsagh-sadeh'] },
    { slug: 'socks-men', name: 'جوراب مردانه', tagline: 'کلاسیک و اسپرت', products: ['jorab-mardane-classic', 'jorab-mardane-sport'] },
    { slug: 'socks-kids', name: 'جوراب کودکان', tagline: 'نرم برای پوست حساس', products: ['jorab-koodak-nakhi'] },
  ],
  tights: [
    { slug: 'tights-sheer', name: 'شفاف و نازک', tagline: '۲۰ دنیر و ساتن', products: ['joorab-shalvari-shafaf-20', 'joorab-shalvari-satin', 'joorab-shalvari-tori-lab', 'joorab-shalvari-nakhi-tabestan', 'sagh-joorab-keshbaf'] },
    { slug: 'tights-opaque', name: 'مات و ضخیم', tagline: 'برای روزهای سرد', products: ['joorab-shalvari-mat-40', 'joorab-shalvari-baft-garm-80', 'joorab-shalvari-mokhmali'] },
    { slug: 'tights-shaping', name: 'فرم‌دهنده و پک‌ها', tagline: 'کمر بلند و پک اقتصادی', products: ['joorab-shalvari-control', 'joorab-shalvari-pack3'] },
  ],
  hair: [
    { slug: 'hair-scrunchies', name: 'اسکرانچی و کش', tagline: 'ابریشم و پارچه', products: ['eskeranchi-abrisham-dorosht', 'eskeranchi-pack2', 'kesh-parchei-pack3'] },
    { slug: 'hair-clips', name: 'گیره و کلیپس', tagline: 'مروارید، لاک‌پشتی، طلایی', products: ['gire-morvarid', 'gire-lakposhti-mat', 'gire-panjee-tala'] },
    { slug: 'hair-bands', name: 'هدبند و روبان', tagline: 'جزئیات ظریف', products: ['hedband-abrisham', 'roban-mo-abrisham'] },
  ],
  underwear: [
    { slug: 'underwear-women', name: 'شورت زنانه', tagline: 'بی‌درز و پنبهٔ ارگانیک', products: ['short-penbe-organic-bedoon-derz', 'short-labetori', 'short-boyshort', 'set-short-pack3', 'short-kamar-boland'] },
    { slug: 'underwear-men', name: 'شورت و زیرپوش مردانه', tagline: 'نخی و میکرو', products: ['short-mardane-boxer', 'short-mardane-micro', 'zirpush-mardane-nakhi'] },
    { slug: 'underwear-kids', name: 'شورتک کودکان', tagline: 'دخترانه و پسرانه', products: ['shortk-dokhtarane', 'shortk-pesarane'] },
  ],
};
