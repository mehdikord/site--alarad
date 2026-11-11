import type { Product, Variant, ProductTag, Review } from '@/lib/types';

type SizeSet = 'sock' | 'sockKids' | 'tights' | 'briefs' | 'boxer' | 'hair';

interface Def {
  slug: string;
  name: string;
  subtitle: string;
  category: Product['category'];
  audience: Product['audience'];
  price: number;
  compare?: number;
  colors: string[];
  sizeSet: SizeSet;
  shots: string[];
  desc: string[];
  material: string;
  care: string;
  rating: number;
  reviews: number;
  tags: ProductTag[];
  createdAt: string;
  popularity: number;
  highlights: string[];
  /** color → stock per size, in `sizeSet` order. Missing → deterministic fill. */
  stock?: Record<string, number[]>;
}

const SIZES: Record<SizeSet, string[]> = {
  sock: ['festival', 'standard'],
  sockKids: ['kids-s', 'kids-m', 'kids-l'],
  tights: ['s', 'm', 'l', 'xl'],
  briefs: ['s', 'm', 'l', 'xl'],
  boxer: ['m', 'l', 'xl', 'xxl'],
  hair: ['one'],
};

const CAT_CODE: Record<Product['category'], string> = {
  socks: 'SK',
  tights: 'TG',
  hair: 'HR',
  underwear: 'UW',
};

/** deterministic, stable pseudo-random so SSR and client agree */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h % 1000) / 1000;
  };
}

const SHOT: Record<Product['category'], string[]> = {
  socks: ['sock-ankle', 'socks-grid', 'socks-pair', 'sock-ankle-detail'],
  tights: ['tights-roll', 'tights-flat', 'tights-box', 'tights-drape'],
  hair: ['scrunchie', 'hair-flat', 'scrunchie-detail', 'hair-clip'],
  underwear: ['briefs-stack', 'briefs-detail', 'folded', 'briefs-alt'],
};

function build(def: Def, index: number): Product {
  const sizes = SIZES[def.sizeSet];
  const rand = seeded(def.slug);
  const variants: Variant[] = [];
  def.colors.forEach((color, ci) => {
    sizes.forEach((size, si) => {
      const explicit = def.stock?.[color]?.[si];
      let stock: number;
      if (explicit !== undefined) stock = explicit;
      else {
        const r = rand();
        // realistic distribution: mostly healthy, some low, occasional sold out
        stock = r < 0.12 ? 0 : r < 0.3 ? 1 + Math.floor(r * 5) : 6 + Math.floor(r * 34);
      }
      variants.push({
        id: `${def.slug}-${color}-${size}`,
        sku: `AL-${CAT_CODE[def.category]}-${String(index + 1).padStart(3, '0')}-${color.slice(0, 2).toUpperCase()}-${size.toUpperCase()}`,
        color,
        size,
        stock,
      });
    });
  });

  return {
    id: `p${String(index + 1).padStart(3, '0')}`,
    slug: def.slug,
    name: def.name,
    subtitle: def.subtitle,
    description: def.desc,
    category: def.category,
    audience: def.audience,
    price: def.price,
    compareAtPrice: def.compare,
    colors: def.colors,
    sizes,
    variants,
    shots: def.shots,
    details: { material: def.material, care: def.care, origin: 'ایران — بافت کارگاه الاردشاپ' },
    rating: def.rating,
    reviewCount: def.reviews,
    tags: def.tags,
    createdAt: def.createdAt,
    popularity: def.popularity,
    highlights: def.highlights,
  };
}

const DEFS: Def[] = [
  /* ─────────────────────────── جوراب ─────────────────────────── */
  {
    slug: 'saq-kootah-penbe-masri',
    name: 'جوراب ساق کوتاه پنبهٔ مصری',
    subtitle: 'کشباف نرم، بدون فشار روی مچ',
    category: 'socks',
    audience: 'women',
    price: 89_000,
    colors: ['cream', 'oat', 'sage', 'blush', 'charcoal'],
    sizeSet: 'sock',
    shots: ['sock-ankle', 'socks-grid', 'socks-pair', 'sock-ankle-detail'],
    desc: [
      'ساق کوتاهی که زیر کفش دیده نمی‌شود، اما لطافتش را تمام روز حس می‌کنید. بافت ۲۰۰ نخ پنبهٔ مصری با کشباف دوگانه، بعد از ده‌ها شست‌وشو فرم خود را نگه می‌دارد.',
      'کشی مچ کاملاً بدون فشار طراحی شده تا جای خط و درد باقی نماند؛ مناسب استفادهٔ روزانه، ورزش سبک و سفر.',
    ],
    material: '۸۰٪ پنبهٔ مصری، ۱۷٪ پلی‌آمید، ۳٪ الاستان',
    care: 'شست‌وشو با آب سرد تا ۳۰ درجه، خشک کردن در سایه',
    rating: 4.9,
    reviews: 312,
    tags: ['bestseller', 'cotton', 'recommended'],
    createdAt: '2026-08-12',
    popularity: 98,
    highlights: ['بافت ۲۰۰ نخ', 'کشی بدون فشار', 'بدون گشادی بعد از شست‌وشو'],
    stock: { cream: [42, 28], oat: [31, 22], sage: [18, 4], blush: [12, 0], charcoal: [9, 26] },
  },
  {
    slug: 'jorab-machi-pack3',
    name: 'جوراب مچی روزمره — پک ۳ عددی',
    subtitle: 'سه رنگ هماهنگ، یک قیمت مهربان',
    category: 'socks',
    audience: 'women',
    price: 189_000,
    compare: 227_000,
    colors: ['cream', 'oat', 'dove'],
    sizeSet: 'sock',
    shots: ['socks-pair', 'socks-grid', 'sock-ankle', 'socks-row'],
    desc: [
      'ست سه‌تایی از رنگ‌های بی‌زمان: کرم، شیری و طوسی روشن. انتخاب سریع برای روزهایی که نمی‌خواهید فکر کنید.',
      'بافت نخی تنفس‌پذیر با نوک و پاشنهٔ تقویت‌شده؛ مناسب پوشیدن روزانه.',
    ],
    material: '۷۵٪ پنبه، ۲۲٪ پلی‌آمید، ۳٪ الاستان',
    care: 'قابل شست‌وشو در ماشین لباسشویی، برنامهٔ لباس‌های حساس',
    rating: 4.8,
    reviews: 208,
    tags: ['bestseller', 'gift', 'cotton'],
    createdAt: '2026-07-02',
    popularity: 95,
    highlights: ['ست ۳ عددی', 'نوک و پاشنهٔ تقویت‌شده', 'رنگ‌های هماهنگ'],
    stock: { cream: [24, 15], oat: [7, 19], dove: [3, 2] },
  },
  {
    slug: 'jorab-saq-boland-keshbaf',
    name: 'جوراب ساق بلند کشباف',
    subtitle: 'برای روزهای خنک بهار و پاییز',
    category: 'socks',
    audience: 'women',
    price: 119_000,
    colors: ['cream', 'sage', 'charcoal', 'blush'],
    sizeSet: 'sock',
    shots: ['sock-ankle-alt', 'socks-grid', 'sock-ankle', 'socks-row'],
    desc: [
      'ساق بلند با بافت عمودی که پا را باریک‌تر نشان می‌دهد. ضخامت متوسط، مناسب کفش‌های لوفر و بوتین‌های کوتاه.',
      'الیاف پنبه با پلی‌آمید برای دوام بیشتر؛ رنگ‌بندی آرام و آسان برای ست کردن.',
    ],
    material: '۷۸٪ پنبه، ۱۹٪ پلی‌آمید، ۳٪ الاستان',
    care: 'شست‌وشو با آب سرد، بدون سفیدکننده',
    rating: 4.7,
    reviews: 156,
    tags: ['recommended', 'cotton'],
    createdAt: '2026-09-01',
    popularity: 82,
    highlights: ['بافت عمودی زیبابخش', 'ساق بلند', 'دوام بالا'],
    stock: { cream: [30, 21], sage: [5, 8], charcoal: [0, 14], blush: [11, 3] },
  },
  {
    slug: 'jorab-baft-zemestani',
    name: 'جوراب بافت زمستانی',
    subtitle: 'گرمای سبک، بدون ضخامت اضافه',
    category: 'socks',
    audience: 'women',
    price: 149_000,
    colors: ['oat', 'cream', 'charcoal'],
    sizeSet: 'sock',
    shots: ['socks-row', 'sock-ankle-alt', 'socks-pair', 'socks-grid'],
    desc: [
      'بافت درشت و گرم با پرزهای ملایم؛ انتخاب اول روزهای سرد برای خانه و بیرون.',
      'الیاف پشم مرینوس نرم که خارش نمی‌دهد و رطوبت را عبور می‌دهد.',
    ],
    material: '۴۵٪ پشم مرینوس، ۴۰٪ پنبه، ۱۲٪ پلی‌آمید، ۳٪ الاستان',
    care: 'شست‌وشوی دستی با آب سرد، خشک کردن خوابیده',
    rating: 4.8,
    reviews: 94,
    tags: ['winter', 'new', 'gift'],
    createdAt: '2026-10-20',
    popularity: 88,
    highlights: ['پشم مرینوس', 'بدون خارش', 'بافت گرم و سبک'],
    stock: { oat: [16, 9], cream: [12, 11], charcoal: [4, 6] },
  },
  {
    slug: 'jorab-katan-tabestani',
    name: 'جوراب کتان تابستانی',
    subtitle: 'تنفس‌پذیرترین انتخاب فصل',
    category: 'socks',
    audience: 'women',
    price: 95_000,
    colors: ['cream', 'dove', 'blush'],
    sizeSet: 'sock',
    shots: ['sock-ankle-detail', 'socks-pair', 'socks-grid', 'sock-ankle'],
    desc: [
      'ترکیب کتان و پنبه با بافتی سبک که هوا را عبور می‌دهد؛ مناسب تابستان‌های گرم.',
      'لبهٔ نازک و بدون دوخت اضافه، حتی زیر کفش‌های تنگ هم احساس نمی‌شود.',
    ],
    material: '۵۵٪ کتان، ۴۲٪ پنبه، ۳٪ الاستان',
    care: 'شست‌وشوی دستی توصیه می‌شود',
    rating: 4.6,
    reviews: 67,
    tags: ['cotton', 'recommended'],
    createdAt: '2026-06-11',
    popularity: 64,
    highlights: ['تنفس‌پذیری بالا', 'لبهٔ نازک', 'مناسب تابستان'],
    stock: { cream: [22, 13], dove: [6, 4], blush: [0, 8] },
  },
  {
    slug: 'jorab-varzeshi-kootah',
    name: 'جوراب ورزشی کوتاه',
    subtitle: 'ثابت روی پا، حتی در دویدن',
    category: 'socks',
    audience: 'unisex',
    price: 109_000,
    colors: ['dove', 'charcoal', 'cream'],
    sizeSet: 'sock',
    shots: ['socks-grid', 'sock-ankle', 'socks-row', 'socks-pair'],
    desc: [
      'پاشنه و کف پا با بالشتک ملایم برای جذب ضربه؛ کشی که در حرکت جا نمی‌رود.',
      'بافت مش در پشت پا برای تهویه؛ بدون درز اضافه در ناحیهٔ انگشتان.',
    ],
    material: '۶۸٪ پنبه، ۲۸٪ پلی‌آمید، ۴٪ الاستان',
    care: 'شست‌وشو در ماشین، بدون نرم‌کننده',
    rating: 4.7,
    reviews: 121,
    tags: ['cotton'],
    createdAt: '2026-05-19',
    popularity: 71,
    highlights: ['بالشتک جذب ضربه', 'بافت مش تهویه', 'بدون درز انگشتان'],
    stock: { dove: [18, 20], charcoal: [13, 0], cream: [9, 15] },
  },
  {
    slug: 'jorab-nimsagh-sadeh',
    name: 'جوراب نیم‌ساق ساده',
    subtitle: 'کلاسیک، ارزان، همیشه مناسب',
    category: 'socks',
    audience: 'women',
    price: 69_000,
    colors: ['cream', 'oat', 'black', 'sage'],
    sizeSet: 'sock',
    shots: ['sock-ankle', 'socks-pair', 'socks-grid', 'socks-row'],
    desc: [
      'همان جوراب ساده‌ای که همیشه لازم است؛ بافت صاف و یکدست با کشی ملایم.',
      'مناسب استفادهٔ روزمرهٔ محل کار و خانه.',
    ],
    material: '۷۲٪ پنبه، ۲۵٪ پلی‌آمید، ۳٪ الاستان',
    care: 'شست‌وشو با آب سرد تا ۳۰ درجه',
    rating: 4.5,
    reviews: 189,
    tags: ['cotton'],
    createdAt: '2026-04-08',
    popularity: 77,
    highlights: ['بافت یکدست', 'کشی ملایم', 'قیمت مناسب'],
    stock: { cream: [40, 35], oat: [28, 22], black: [2, 5], sage: [14, 16] },
  },
  {
    slug: 'jorab-koodak-nakhi',
    name: 'جوراب کودکان نخی',
    subtitle: 'نرم، بدون رنگ شیمیایی',
    category: 'socks',
    audience: 'kids',
    price: 59_000,
    colors: ['cream', 'blush', 'sage', 'dove'],
    sizeSet: 'sockKids',
    shots: ['socks-pair', 'socks-row', 'socks-grid', 'sock-ankle-detail'],
    desc: [
      'پنبهٔ نرم با رنگ‌های گیاهی و بدون مواد حساسیت‌زا؛ مناسب پوست حساس کودکان.',
      'کشی نرم که جای خط روی پای کوچک باقی نمی‌گذارد.',
    ],
    material: '۹۰٪ پنبه، ۸٪ پلی‌آمید، ۲٪ الاستان',
    care: 'شست‌وشو با مایع مخصوص لباس کودک',
    rating: 4.9,
    reviews: 143,
    tags: ['cotton', 'gift', 'recommended'],
    createdAt: '2026-09-22',
    popularity: 86,
    highlights: ['رنگ گیاهی', 'مناسب پوست حساس', 'کشی نرم'],
    stock: { cream: [15, 18, 12], blush: [9, 7, 4], sage: [6, 3, 8], dove: [0, 11, 10] },
  },
  {
    slug: 'jorab-mardane-classic',
    name: 'جوراب مردانه کلاسیک',
    subtitle: 'کشباف رسمی با دوام بالا',
    category: 'socks',
    audience: 'men',
    price: 99_000,
    colors: ['black', 'charcoal', 'navy', 'dove'],
    sizeSet: 'sock',
    shots: ['socks-grid', 'socks-row', 'sock-ankle', 'socks-pair'],
    desc: [
      'جوراب رسمی با بافت ریز و براقیت ملایم، مناسب کفش‌های چرم.',
      'کشی که تا آخر روز ساق را بالا نگه می‌دارد.',
    ],
    material: '۷۶٪ پنبه، ۲۱٪ پلی‌آمید، ۳٪ الاستان',
    care: 'شست‌وشو با آب سرد، خشک کردن در سایه',
    rating: 4.7,
    reviews: 176,
    tags: ['bestseller', 'cotton'],
    createdAt: '2026-03-30',
    popularity: 90,
    highlights: ['ساق ماندگار', 'بافت رسمی', 'مناسب کفش چرم'],
    stock: { black: [26, 31], charcoal: [19, 14], navy: [8, 12], dove: [5, 0] },
  },
  {
    slug: 'jorab-mardane-sport',
    name: 'جوراب مردانه اسپرت',
    subtitle: 'ضخامت متوسط، کف تقویت‌شده',
    category: 'socks',
    audience: 'men',
    price: 105_000,
    colors: ['dove', 'charcoal', 'cream'],
    sizeSet: 'sock',
    shots: ['socks-row', 'socks-grid', 'socks-pair', 'sock-ankle'],
    desc: [
      'جوراب اسپرت با کف پنبه‌ای ضخیم و تهویهٔ پشت پا؛ برای پیاده‌روی‌های طولانی.',
      'بدون درز اصطکاکی در ناحیهٔ انگشتان.',
    ],
    material: '۷۰٪ پنبه، ۲۶٪ پلی‌آمید، ۴٪ الاستان',
    care: 'شست‌وشو در ماشین لباسشویی',
    rating: 4.6,
    reviews: 88,
    tags: ['cotton'],
    createdAt: '2026-02-14',
    popularity: 66,
    highlights: ['کف ضخیم', 'تهویهٔ پشت پا', 'بدون درز'],
    stock: { dove: [21, 17], charcoal: [6, 9], cream: [13, 4] },
  },

  /* ─────────────────────── جوراب‌شلواری ─────────────────────── */
  {
    slug: 'joorab-shalvari-shafaf-20',
    name: 'جوراب‌شلواری شفاف ۲۰ دنیر',
    subtitle: 'ظریف و هم‌رنگ پوست',
    category: 'tights',
    audience: 'women',
    price: 149_000,
    colors: ['cream', 'rose', 'black'],
    sizeSet: 'tights',
    shots: ['tights-roll', 'tights-flat', 'tights-box', 'tights-drape'],
    desc: [
      'شفافیت بسیار ظریف با رنگ‌های نزدیک به پوست؛ خط پا را یکدست و طبیعی نشان می‌دهد.',
      'کمر کشی پهن و نامرئی که در لباس‌های تنگ دیده نمی‌شود. کاپسهٔ پاشنه تقویت‌شده برای دوام بیشتر.',
    ],
    material: '۸۸٪ پلی‌آمید، ۱۲٪ الاستان',
    care: 'شست‌وشوی دستی با آب سرد، بدون خشک‌کن',
    rating: 4.8,
    reviews: 421,
    tags: ['bestseller', 'sheer', 'recommended'],
    createdAt: '2026-08-28',
    popularity: 99,
    highlights: ['۲۰ دنیر شفاف', 'کمر نامرئی', 'پاشنهٔ تقویت‌شده'],
    stock: { cream: [34, 26, 12, 8], rose: [22, 18, 6, 3], black: [40, 31, 20, 11] },
  },
  {
    slug: 'joorab-shalvari-mat-40',
    name: 'جوراب‌شلواری مات ۴۰ دنیر',
    subtitle: 'پوشش یکدست برای محل کار',
    category: 'tights',
    audience: 'women',
    price: 179_000,
    colors: ['black', 'charcoal', 'rose'],
    sizeSet: 'tights',
    shots: ['tights-flat', 'tights-roll', 'tights-flat-detail', 'tights-drape'],
    desc: [
      'مات کامل بدون درخشش؛ انتخاب مطمئن برای محیط کار و لباس‌های رسمی.',
      'ضخامت ۴۰ دنیر تعادل خوبی بین پوشش و سبکی ایجاد می‌کند.',
    ],
    material: '۸۵٪ پلی‌آمید، ۱۵٪ الاستان',
    care: 'شست‌وشوی دستی، آویزان کردن برای خشک شدن',
    rating: 4.7,
    reviews: 283,
    tags: ['bestseller', 'recommended'],
    createdAt: '2026-07-15',
    popularity: 94,
    highlights: ['مات بدون درخشش', 'مناسب محل کار', 'کمر بلند'],
    stock: { black: [28, 24, 15, 9], charcoal: [17, 12, 8, 4], rose: [5, 2, 0, 6] },
  },
  {
    slug: 'joorab-shalvari-baft-garm-80',
    name: 'جوراب‌شلواری بافت گرم ۸۰ دنیر',
    subtitle: 'زمستان بدون سرما',
    category: 'tights',
    audience: 'women',
    price: 219_000,
    colors: ['charcoal', 'black', 'rose'],
    sizeSet: 'tights',
    shots: ['tights-drape', 'tights-flat', 'tights-roll', 'tights-flat-detail'],
    desc: [
      'بافت ضخیم با پرز داخلی نرم که گرما را نگه می‌دارد و زیر لباس برجسته نمی‌شود.',
      'کشی چهارطرفه با برگشت‌پذیری بالا؛ بدون افتادگی زانو بعد از چند ساعت.',
    ],
    material: '۷۸٪ پلی‌آمید، ۱۸٪ الاستان، ۴٪ پشم',
    care: 'شست‌وشوی دستی با آب سرد',
    rating: 4.8,
    reviews: 167,
    tags: ['winter', 'recommended'],
    createdAt: '2026-10-08',
    popularity: 87,
    highlights: ['پرز داخلی گرم', 'بدون افتادگی زانو', 'کشی چهارطرفه'],
    stock: { charcoal: [14, 11, 5, 3], black: [20, 16, 9, 7], rose: [4, 0, 2, 1] },
  },
  {
    slug: 'joorab-shalvari-satin',
    name: 'جوراب‌شلواری ساتن درخشان',
    subtitle: 'برای شب‌های مهمانی',
    category: 'tights',
    audience: 'women',
    price: 199_000,
    colors: ['black', 'rose', 'cream'],
    sizeSet: 'tights',
    shots: ['tights-flat-detail', 'tights-drape', 'tights-flat', 'tights-box'],
    desc: [
      'درخشش بسیار ملایم و طبیعی که در نور، بازتاب ساتن دارد.',
      'مناسب مهمانی و مجالس؛ با کمر کشی نامرئی و دوخت تخت.',
    ],
    material: '۸۲٪ پلی‌آمید، ۱۸٪ الاستان',
    care: 'شست‌وشوی دستی، نگهداری در کیسهٔ پارچه‌ای',
    rating: 4.6,
    reviews: 112,
    tags: ['gift', 'sheer'],
    createdAt: '2026-09-14',
    popularity: 74,
    highlights: ['بازتاب ساتن', 'کمر نامرئی', 'دوخت تخت'],
    stock: { black: [11, 8, 4, 2], rose: [6, 5, 3, 0], cream: [9, 7, 4, 3] },
  },
  {
    slug: 'joorab-shalvari-control',
    name: 'جوراب‌شلواری کمر بلند فرم‌دهنده',
    subtitle: 'پشتیبانی نرم شکم و کمر',
    category: 'tights',
    audience: 'women',
    price: 239_000,
    compare: 279_000,
    colors: ['black', 'rose', 'charcoal'],
    sizeSet: 'tights',
    shots: ['tights-box', 'tights-roll', 'tights-flat', 'tights-drape'],
    desc: [
      'ناحیهٔ کمر و شکم با بافت فشاری ملایم که فرم می‌دهد بدون آنکه احساس فشار کند.',
      'مناسب پوشیدن زیر لباس‌های مجلسی و دامن‌های تنگ.',
    ],
    material: '۷۶٪ پلی‌آمید، ۲۴٪ الاستان',
    care: 'شست‌وشوی دستی با آب سرد',
    rating: 4.7,
    reviews: 198,
    tags: ['bestseller', 'recommended'],
    createdAt: '2026-06-25',
    popularity: 91,
    highlights: ['فرم‌دهی ملایم', 'کمر بلند', 'بدون احساس فشار'],
    stock: { black: [23, 18, 12, 6], rose: [7, 4, 2, 1], charcoal: [12, 9, 5, 3] },
  },
  {
    slug: 'joorab-shalvari-tori-lab',
    name: 'جوراب‌شلواری لبه‌توری',
    subtitle: 'جزئیات ظریف، بدون اغراق',
    category: 'tights',
    audience: 'women',
    price: 259_000,
    colors: ['black', 'cream', 'rose'],
    sizeSet: 'tights',
    shots: ['tights-flat', 'tights-flat-detail', 'tights-drape', 'tights-roll'],
    desc: [
      'نوار توری دست‌دوز در بالای ساق با طرح گل‌های ریز؛ وقتی دامن کوتاه‌تر است، زیبایی دیده می‌شود.',
      'بافت شفاف ۳۰ دنیر با کشی که ساق را ثابت نگه می‌دارد.',
    ],
    material: '۸۴٪ پلی‌آمید، ۱۴٪ الاستان، ۲٪ نایلون توری',
    care: 'شست‌وشوی دستی، بدون چلاندن',
    rating: 4.5,
    reviews: 74,
    tags: ['gift', 'sheer'],
    createdAt: '2026-10-02',
    popularity: 69,
    highlights: ['توری دست‌دوز', '۳۰ دنیر', 'کشی ثابت'],
    stock: { black: [9, 6, 4, 2], cream: [5, 3, 2, 0], rose: [4, 2, 1, 1] },
  },
  {
    slug: 'joorab-shalvari-nakhi-tabestan',
    name: 'جوراب‌شلواری نخی تابستانی',
    subtitle: 'سبک، تنفس‌پذیر، بدون تعریق',
    category: 'tights',
    audience: 'women',
    price: 165_000,
    colors: ['cream', 'rose', 'dove'],
    sizeSet: 'tights',
    shots: ['tights-roll', 'tights-flat', 'tights-box', 'tights-drape'],
    desc: [
      'ترکیب پنبه و پلی‌آمید با بافت باز که هوا را عبور می‌دهد؛ برای تابستان‌های خشک و گرم.',
      'کمر نرم و بدون کشی سفت؛ مناسب استفادهٔ طولانی.',
    ],
    material: '۴۰٪ پنبه، ۵۲٪ پلی‌آمید، ۸٪ الاستان',
    care: 'شست‌وشو با آب سرد، خشک کردن در سایه',
    rating: 4.4,
    reviews: 61,
    tags: ['cotton'],
    createdAt: '2026-05-05',
    popularity: 58,
    highlights: ['بافت تنفس‌پذیر', 'کمر نرم', 'مناسب تابستان'],
    stock: { cream: [16, 12, 7, 4], rose: [11, 8, 3, 2], dove: [0, 5, 4, 2] },
  },
  {
    slug: 'joorab-shalvari-pack3',
    name: 'جوراب‌شلواری شفاف — پک ۳ عددی',
    subtitle: 'همیشه یکی در کشو داشته باشید',
    category: 'tights',
    audience: 'women',
    price: 399_000,
    compare: 447_000,
    colors: ['cream', 'black'],
    sizeSet: 'tights',
    shots: ['tights-box', 'tights-flat', 'tights-roll', 'tights-drape'],
    desc: [
      'سه عدد جوراب‌شلواری ۲۰ دنیر در یک بسته؛ صرفه‌جویی برای استفادهٔ روزمره.',
      'هر عدد در بسته‌بندی جداگانه و قابل حمل.',
    ],
    material: '۸۸٪ پلی‌آمید، ۱۲٪ الاستان',
    care: 'شست‌وشوی دستی',
    rating: 4.7,
    reviews: 233,
    tags: ['bestseller', 'gift'],
    createdAt: '2026-04-22',
    popularity: 89,
    highlights: ['۳ عدد در بسته', 'بسته‌بندی جداگانه', 'صرفه‌جویی'],
    stock: { cream: [13, 10, 6, 4], black: [19, 15, 9, 5] },
  },
  {
    slug: 'joorab-shalvari-mokhmali',
    name: 'جوراب‌شلواری مخملی زمستانی',
    subtitle: 'لمس مخمل، گرمای واقعی',
    category: 'tights',
    audience: 'women',
    price: 289_000,
    colors: ['charcoal', 'black', 'rose'],
    sizeSet: 'tights',
    shots: ['tights-flat', 'tights-drape', 'tights-flat-detail', 'tights-roll'],
    desc: [
      'سطح مخملی مات با پرز کوتاه که گرما را نگه می‌دارد و ظاهری لوکس دارد.',
      'مناسب سفرهای زمستانی و روزهای سرد؛ با کمر بلند و کشی راحت.',
    ],
    material: '۷۰٪ پلی‌آمید، ۲۲٪ الاستان، ۸٪ پلی‌استر مخمل',
    care: 'شست‌وشوی دستی، خشک کردن خوابیده',
    rating: 4.8,
    reviews: 139,
    tags: ['winter', 'gift'],
    createdAt: '2026-10-26',
    popularity: 84,
    highlights: ['سطح مخملی', 'کمر بلند', 'گرمای بالا'],
    stock: { charcoal: [10, 8, 4, 2], black: [15, 12, 7, 3], rose: [3, 1, 0, 2] },
  },
  {
    slug: 'sagh-joorab-keshbaf',
    name: 'ساق‌جوراب کشباف بلند',
    subtitle: 'خط بلند پا، حس کلاسیک',
    category: 'tights',
    audience: 'women',
    price: 189_000,
    colors: ['black', 'charcoal', 'cream'],
    sizeSet: 'tights',
    shots: ['tights-drape', 'tights-flat', 'tights-roll', 'tights-flat-detail'],
    desc: [
      'ساق‌جوراب بلند با بافت ریب و نوار سیلیکونی نازک داخلی که روی ران ثابت می‌ماند.',
      'بدون نیاز به بند؛ مناسب دامن کوتاه و بوت‌های بلند.',
    ],
    material: '۸۰٪ پلی‌آمید، ۱۸٪ الاستان، ۲٪ سیلیکون',
    care: 'شست‌وشوی دستی، بدون خشک‌کن',
    rating: 4.6,
    reviews: 96,
    tags: ['sheer', 'gift'],
    createdAt: '2026-09-05',
    popularity: 72,
    highlights: ['نوار سیلیکونی ثابت', 'بافت ریب', 'بدون نیاز به بند'],
    stock: { black: [12, 9, 5, 3], charcoal: [7, 5, 3, 2], cream: [4, 2, 1, 0] },
  },

  /* ─────────────────────── اکسسوری مو ─────────────────────── */
  {
    slug: 'eskeranchi-abrisham-dorosht',
    name: 'اسکرانچی ابریشم درشت',
    subtitle: 'بدون شکستن مو، بدون خط',
    category: 'hair',
    audience: 'women',
    price: 129_000,
    colors: ['cream', 'sage', 'blush', 'charcoal'],
    sizeSet: 'hair',
    shots: ['scrunchie', 'hair-flat', 'scrunchie-detail', 'scrunchie-alt'],
    desc: [
      'اسکرانچی درشت از ساتن ابریشم با دوخت تمیز؛ مو را نمی‌شکند و جای کش روی مچ دست نمی‌گذارد.',
      'حجم دقیق محاسبه‌شده برای موهای پرپشت؛ فنر داخلی قوی که شل نمی‌شود.',
    ],
    material: 'رویهٔ ساتن ابریشم، فنر داخلی مقاوم',
    care: 'شست‌وشوی دستی با آب سرد و صابون ملایم',
    rating: 4.9,
    reviews: 264,
    tags: ['bestseller', 'gift', 'recommended'],
    createdAt: '2026-08-30',
    popularity: 97,
    highlights: ['ساتن ابریشم', 'بدون خط روی مو', 'دست‌دوز'],
    stock: { cream: [24], sage: [18], blush: [11], charcoal: [3] },
  },
  {
    slug: 'eskeranchi-pack2',
    name: 'اسکرانچی ابریشم متوسط — پک ۲',
    subtitle: 'دو رنگ، یک هدیهٔ کوچک',
    category: 'hair',
    audience: 'women',
    price: 179_000,
    compare: 219_000,
    colors: ['cream', 'blush', 'sage'],
    sizeSet: 'hair',
    shots: ['scrunchie-alt', 'hair-flat', 'scrunchie', 'scrunchie-detail'],
    desc: [
      'دو اسکرانچی متوسط در بسته‌بندی هدیه؛ انتخاب آسان برای دوست و خواهر.',
      'جنس ساتن با درخشش ملایم و دوخت بدون درز اضافه.',
    ],
    material: 'رویهٔ ساتن، فنر داخلی',
    care: 'شست‌وشوی دستی',
    rating: 4.8,
    reviews: 118,
    tags: ['gift', 'recommended'],
    createdAt: '2026-07-19',
    popularity: 83,
    highlights: ['بسته‌بندی هدیه', 'دو عدد', 'ساتن نرم'],
    stock: { cream: [16], blush: [9], sage: [5] },
  },
  {
    slug: 'gire-morvarid',
    name: 'گیرهٔ مرواریدنشان',
    subtitle: 'جزئیات طلایی، بی‌سر‌و‌صدا',
    category: 'hair',
    audience: 'women',
    price: 189_000,
    colors: ['cream', 'blush'],
    sizeSet: 'hair',
    shots: ['hair-clip', 'hair-flat', 'pearl', 'scrunchie-detail'],
    desc: [
      'گیرهٔ فلزی با مرواریدهای کوچک دست‌چین‌شده؛ محکم می‌گیرد و مو را نمی‌کشد.',
      'مناسب بالا بستن نیمهٔ مو یا جمع کردن کامل.',
    ],
    material: 'آلیاژ فلزی با آبکاری طلایی مات، مروارید مصنوعی',
    care: 'دور از آب و عطر نگهداری شود',
    rating: 4.7,
    reviews: 87,
    tags: ['gift', 'new'],
    createdAt: '2026-10-22',
    popularity: 79,
    highlights: ['مروارید دست‌چین', 'آبکاری طلایی مات', 'فنر محکم'],
    stock: { cream: [8], blush: [4] },
  },
  {
    slug: 'gire-lakposhti-mat',
    name: 'گیرهٔ لاک‌پشتی مات',
    subtitle: 'همراه روزمرهٔ موهای پرپشت',
    category: 'hair',
    audience: 'women',
    price: 89_000,
    colors: ['cream', 'sage', 'charcoal', 'blush'],
    sizeSet: 'hair',
    shots: ['hair-clip', 'scrunchie-detail', 'hair-flat', 'pearl'],
    desc: [
      'گیرهٔ ساده با سطح مات و لبه‌های صاف؛ بدون شکستگی و بدون کشیدگی مو.',
      'فنر قوی برای موهای پرحجم.',
    ],
    material: 'رزین مات، فنر فولادی',
    care: 'با دستمال نرم تمیز شود',
    rating: 4.5,
    reviews: 152,
    tags: ['recommended'],
    createdAt: '2026-06-02',
    popularity: 81,
    highlights: ['سطح مات', 'فنر قوی', 'لبهٔ صاف'],
    stock: { cream: [22], sage: [17], charcoal: [13], blush: [2] },
  },
  {
    slug: 'kesh-parchei-pack3',
    name: 'کش پارچه‌ای نرم — پک ۳',
    subtitle: 'بدون فشار، بدون شکستگی',
    category: 'hair',
    audience: 'women',
    price: 69_000,
    colors: ['cream', 'sage', 'blush', 'dove'],
    sizeSet: 'hair',
    shots: ['hair-tie', 'hair-flat', 'scrunchie-detail', 'scrunchie'],
    desc: [
      'کش‌های پارچه‌ای با رویهٔ نخی که مو را نمی‌شکند و جای خط باقی نمی‌گذارد.',
      'کشی متوسط و مناسب استفادهٔ روزانه؛ سه رنگ هماهنگ در هر بسته.',
    ],
    material: 'رویهٔ نخی، کش الاستیک',
    care: 'شست‌وشوی دستی',
    rating: 4.6,
    reviews: 201,
    tags: ['cotton', 'gift'],
    createdAt: '2026-05-28',
    popularity: 76,
    highlights: ['بدون جای خط', 'رویهٔ نخی', '۳ عدد'],
    stock: { cream: [30], sage: [24], blush: [3], dove: [15] },
  },
  {
    slug: 'hedband-abrisham',
    name: 'هدبند ابریشم گره‌دار',
    subtitle: 'لمس ابریشم روی مو',
    category: 'hair',
    audience: 'women',
    price: 149_000,
    colors: ['cream', 'sage', 'blush'],
    sizeSet: 'hair',
    shots: ['hair-scrunchie', 'scrunchie', 'hair-flat', 'scrunchie-detail'],
    desc: [
      'هدبند ابریشم با گرهٔ جلویی و کشی نرم در پشت؛ بدون فشار روی پیشانی.',
      'مناسب ورزش، آرایش و روزهای بدون حالت‌دهی مو.',
    ],
    material: 'ساتن ابریشم، کش نرم',
    care: 'شست‌وشوی دستی با آب سرد',
    rating: 4.7,
    reviews: 94,
    tags: ['gift', 'new'],
    createdAt: '2026-10-14',
    popularity: 73,
    highlights: ['ساتن ابریشم', 'کش نرم', 'گرهٔ جلویی'],
    stock: { cream: [12], sage: [7], blush: [5] },
  },
  {
    slug: 'gire-panjee-tala',
    name: 'گیرهٔ پنجه‌ای طلایی',
    subtitle: 'ساده و همیشه شیک',
    category: 'hair',
    audience: 'women',
    price: 99_000,
    colors: ['cream', 'charcoal'],
    sizeSet: 'hair',
    shots: ['pearl', 'hair-clip', 'hair-flat', 'scrunchie-detail'],
    desc: [
      'گیرهٔ پنجه‌ای فلزی با آبکاری طلایی مات؛ نگه‌داری محکم برای موهای متوسط تا پرحجم.',
      'طراحی مینیمال که با هر استایلی هماهنگ می‌شود.',
    ],
    material: 'آلیاژ فلزی، آبکاری طلایی مات',
    care: 'دور از رطوبت نگهداری شود',
    rating: 4.4,
    reviews: 63,
    tags: [],
    createdAt: '2026-03-11',
    popularity: 61,
    highlights: ['آبکاری مات', 'نگه‌داری محکم', 'طراحی مینیمال'],
    stock: { cream: [9], charcoal: [6] },
  },
  {
    slug: 'roban-mo-abrisham',
    name: 'روبان مو ابریشم',
    subtitle: 'بافت آرام، ظاهر مرتب',
    category: 'hair',
    audience: 'women',
    price: 59_000,
    colors: ['cream', 'sage', 'blush', 'charcoal'],
    sizeSet: 'hair',
    shots: ['ribbon', 'hair-flat', 'scrunchie', 'hair-scrunchie'],
    desc: [
      'روبان ابریشم پهن با لبه‌های دوخته‌شده؛ برای بستن دم‌اسب و بافت‌های ساده.',
      'انتخاب سریع برای جلوگیری از موخوره هنگام خواب.',
    ],
    material: 'ساتن ابریشم',
    care: 'شست‌وشوی دستی',
    rating: 4.3,
    reviews: 48,
    tags: ['gift'],
    createdAt: '2026-02-02',
    popularity: 52,
    highlights: ['لبهٔ دوخته‌شده', 'ابریشم', 'مناسب خواب'],
    stock: { cream: [18], sage: [12], blush: [8], charcoal: [0] },
  },

  /* ─────────────────────── شورت و زیرپوش ─────────────────────── */
  {
    slug: 'short-penbe-organic-bedoon-derz',
    name: 'شورت پنبهٔ ارگانیک بی‌درز',
    subtitle: 'دوخت تخت، بدون اصطکاک',
    category: 'underwear',
    audience: 'women',
    price: 129_000,
    colors: ['cream', 'blush', 'sage', 'charcoal', 'black'],
    sizeSet: 'briefs',
    shots: ['briefs-stack', 'briefs-detail', 'folded', 'briefs-alt'],
    desc: [
      'شورت بی‌درز با لبه‌های چسبان نرم که زیر لباس دیده نمی‌شود؛ پنبهٔ ارگانیک با تنفس‌پذیری بالا.',
      'کشی پهن و راحت که در طول روز جای خود را تغییر نمی‌دهد.',
    ],
    material: '۹۵٪ پنبهٔ ارگانیک، ۵٪ الاستان',
    care: 'شست‌وشو با آب سرد تا ۳۰ درجه، بدون سفیدکننده',
    rating: 4.9,
    reviews: 387,
    tags: ['bestseller', 'cotton', 'recommended'],
    createdAt: '2026-08-18',
    popularity: 96,
    highlights: ['بدون درز', 'پنبهٔ ارگانیک', 'کشی پهن'],
    stock: { cream: [26, 22, 14, 8], blush: [19, 15, 9, 4], sage: [12, 10, 6, 3], charcoal: [8, 6, 3, 0], black: [15, 12, 8, 5] },
  },
  {
    slug: 'short-labetori',
    name: 'شورت لبه‌توری',
    subtitle: 'ظرافت در جزئیات پنهان',
    category: 'underwear',
    audience: 'women',
    price: 149_000,
    colors: ['cream', 'blush', 'rose', 'black'],
    sizeSet: 'briefs',
    shots: ['briefs-detail', 'briefs-stack', 'folded', 'briefs-alt'],
    desc: [
      'توری کشباف نرم در لبه که روی پوست خط نمی‌اندازد؛ ظریف و بی‌اضافه.',
      'جلوی پنبه‌ای برای راحتی روزانه و پشت با پوشش کامل.',
    ],
    material: '۷۰٪ پنبه، ۲۲٪ پلی‌آمید، ۸٪ الاستان',
    care: 'شست‌وشوی دستی با آب سرد',
    rating: 4.7,
    reviews: 214,
    tags: ['gift', 'recommended'],
    createdAt: '2026-07-08',
    popularity: 88,
    highlights: ['توری بدون خط', 'جلوی پنبه‌ای', 'پوشش کامل'],
    stock: { cream: [14, 11, 6, 3], blush: [10, 8, 4, 2], rose: [6, 4, 2, 1], black: [12, 9, 5, 3] },
  },
  {
    slug: 'short-boyshort',
    name: 'شورت بوی‌شورت پنبه‌ای',
    subtitle: 'پوشش کامل، حس آزاد',
    category: 'underwear',
    audience: 'women',
    price: 139_000,
    colors: ['cream', 'sage', 'dove', 'black'],
    sizeSet: 'briefs',
    shots: ['briefs-stack', 'briefs-alt', 'folded', 'briefs-detail'],
    desc: [
      'برش بوی‌شورت با پوشش بیشتر روی ران؛ انتخاب راحت برای زیر دامن و شلوار.',
      'بافت نخی سبک که در روزهای گرم هم خنک می‌ماند.',
    ],
    material: '۹۲٪ پنبه، ۸٪ الاستان',
    care: 'شست‌وشو در ماشین، برنامهٔ لباس‌های حساس',
    rating: 4.8,
    reviews: 176,
    tags: ['cotton', 'bestseller'],
    createdAt: '2026-06-16',
    popularity: 85,
    highlights: ['پوشش بیشتر', 'نخی سبک', 'مناسب روزهای گرم'],
    stock: { cream: [20, 17, 11, 6], sage: [11, 9, 5, 2], dove: [7, 6, 3, 1], black: [13, 10, 6, 4] },
  },
  {
    slug: 'set-short-pack3',
    name: 'ست شورت زنانه — پک ۳ عددی',
    subtitle: 'سه رنگ آرام، یک انتخاب',
    category: 'underwear',
    audience: 'women',
    price: 329_000,
    compare: 387_000,
    colors: ['cream', 'blush', 'sage'],
    sizeSet: 'briefs',
    shots: ['folded', 'briefs-stack', 'briefs-detail', 'briefs-alt'],
    desc: [
      'سه شورت نخی در رنگ‌های کرم، صورتی پودری و سبز مریم‌گلی؛ بسته‌بندی هدیه‌پذیر.',
      'همه با دوخت تخت و کشی نرم؛ مناسب استفادهٔ روزانهٔ هفته.',
    ],
    material: '۹۴٪ پنبه، ۶٪ الاستان',
    care: 'شست‌وشو با آب سرد',
    rating: 4.8,
    reviews: 143,
    tags: ['gift', 'bestseller'],
    createdAt: '2026-09-09',
    popularity: 86,
    highlights: ['۳ عدد در بسته', 'بسته‌بندی هدیه', 'دوخت تخت'],
    stock: { cream: [15, 13, 8, 4], blush: [9, 8, 5, 2], sage: [6, 5, 3, 1] },
  },
  {
    slug: 'short-mardane-boxer',
    name: 'شورت مردانه پنبه',
    subtitle: 'کشی راحت، دوام روزمره',
    category: 'underwear',
    audience: 'men',
    price: 159_000,
    colors: ['charcoal', 'navy', 'dove', 'black'],
    sizeSet: 'boxer',
    shots: ['folded', 'briefs-alt', 'briefs-stack', 'briefs-detail'],
    desc: [
      'بوکسور نخی با کشی پهن و نرم که خط روی پوست نمی‌اندازد؛ برش راحت روی ران.',
      'دوخت سرتاسری و بافت تنفس‌پذیر برای استفادهٔ روزانه.',
    ],
    material: '۹۵٪ پنبه، ۵٪ الاستان',
    care: 'شست‌وشو در ماشین لباسشویی',
    rating: 4.7,
    reviews: 268,
    tags: ['cotton', 'bestseller'],
    createdAt: '2026-05-12',
    popularity: 92,
    highlights: ['کشی پهن', 'برش راحت', 'بافت تنفس‌پذیر'],
    stock: { charcoal: [18, 15, 10, 6], navy: [12, 10, 6, 3], dove: [9, 7, 4, 2], black: [16, 13, 8, 5] },
  },
  {
    slug: 'short-mardane-micro',
    name: 'شورت مردانه میکرو',
    subtitle: 'کشی چهارطرفه، بدون جمع‌شدگی',
    category: 'underwear',
    audience: 'men',
    price: 179_000,
    colors: ['charcoal', 'navy', 'black'],
    sizeSet: 'boxer',
    shots: ['briefs-alt', 'folded', 'briefs-detail', 'briefs-stack'],
    desc: [
      'پارچهٔ میکروفایبر با کشی چهارطرفه که حرکت را آزاد می‌گذارد و در شست‌وشو جمع نمی‌شود.',
      'مناسب ورزش و سفر؛ زودخشک و سبک.',
    ],
    material: '۹۰٪ میکروفایبر، ۱۰٪ الاستان',
    care: 'شست‌وشو با آب سرد، بدون نرم‌کننده',
    rating: 4.6,
    reviews: 121,
    tags: ['recommended'],
    createdAt: '2026-04-04',
    popularity: 70,
    highlights: ['کشی چهارطرفه', 'زودخشک', 'مناسب ورزش'],
    stock: { charcoal: [11, 9, 5, 3], navy: [7, 6, 3, 1], black: [13, 10, 6, 4] },
  },
  {
    slug: 'zirpush-mardane-nakhi',
    name: 'زیرپوش مردانه نخی',
    subtitle: 'تنفس‌پذیر، بدون تحریک پوست',
    category: 'underwear',
    audience: 'men',
    price: 189_000,
    colors: ['cream', 'dove', 'charcoal'],
    sizeSet: 'boxer',
    shots: ['folded', 'briefs-stack', 'briefs-alt', 'briefs-detail'],
    desc: [
      'زیرپوش نخی با یقهٔ گرد و دوخت تخت؛ در زیر پیراهن دیده نمی‌شود.',
      'الیاف پنبه با پوشش کامل و رنگ‌های ساده.',
    ],
    material: '۱۰۰٪ پنبه',
    care: 'شست‌وشو با آب سرد تا ۴۰ درجه',
    rating: 4.5,
    reviews: 97,
    tags: ['cotton'],
    createdAt: '2026-03-20',
    popularity: 62,
    highlights: ['۱۰۰٪ پنبه', 'دوخت تخت', 'بدون خط'],
    stock: { cream: [14, 11, 7, 4], dove: [8, 6, 4, 2], charcoal: [10, 8, 5, 3] },
  },
  {
    slug: 'shortk-dokhtarane',
    name: 'شورتک کودکان دخترانه',
    subtitle: 'نرم و بی‌دردسر برای همهٔ روز',
    category: 'underwear',
    audience: 'kids',
    price: 79_000,
    colors: ['cream', 'blush', 'sage'],
    sizeSet: 'sockKids',
    shots: ['briefs-detail', 'folded', 'briefs-stack', 'briefs-alt'],
    desc: [
      'پنبهٔ نرم با رنگ‌های ملایم و بدون مواد حساسیت‌زا؛ مناسب پوست حساس کودکان.',
      'کشی نرم و دوخت تخت که جای خط باقی نمی‌گذارد.',
    ],
    material: '۹۶٪ پنبه، ۴٪ الاستان',
    care: 'شست‌وشو با مایع مخصوص لباس کودک',
    rating: 4.8,
    reviews: 132,
    tags: ['cotton', 'recommended', 'gift'],
    createdAt: '2026-08-04',
    popularity: 80,
    highlights: ['پنبهٔ نرم', 'بدون رنگ شیمیایی', 'کشی نرم'],
    stock: { cream: [20, 16, 12], blush: [12, 10, 7], sage: [6, 4, 2] },
  },
  {
    slug: 'shortk-pesarane',
    name: 'شورتک کودکان پسرانه',
    subtitle: 'راحت در حرکت',
    category: 'underwear',
    audience: 'kids',
    price: 79_000,
    colors: ['cream', 'dove', 'sage'],
    sizeSet: 'sockKids',
    shots: ['briefs-stack', 'briefs-detail', 'folded', 'briefs-alt'],
    desc: [
      'برش راحت برای بازی و دویدن؛ کشی نرم و بدون اصطکاک.',
      'پنبهٔ تنفس‌پذیر با دوخت مقاوم در برابر شست‌وشوی مکرر.',
    ],
    material: '۹۵٪ پنبه، ۵٪ الاستان',
    care: 'شست‌وشو با مایع مخصوص لباس کودک',
    rating: 4.7,
    reviews: 108,
    tags: ['cotton', 'recommended'],
    createdAt: '2026-08-04',
    popularity: 78,
    highlights: ['برش راحت', 'دوخت مقاوم', 'پنبهٔ تنفس‌پذیر'],
    stock: { cream: [17, 14, 9], dove: [10, 8, 5], sage: [4, 3, 1] },
  },
  {
    slug: 'short-kamar-boland',
    name: 'شورت کمر بلند پنبه‌ای',
    subtitle: 'پشتیبانی نرم کمر و شکم',
    category: 'underwear',
    audience: 'women',
    price: 169_000,
    colors: ['cream', 'blush', 'charcoal'],
    sizeSet: 'briefs',
    shots: ['briefs-stack', 'folded', 'briefs-detail', 'briefs-alt'],
    desc: [
      'کمر بلند با بافت دوگانه که فرم ملایمی می‌دهد بدون فشار؛ مناسب بعد از زایمان و روزهای طولانی.',
      'پنبهٔ ارگانیک با پوشش کامل و بدون درز.',
    ],
    material: '۹۳٪ پنبهٔ ارگانیک، ۷٪ الاستان',
    care: 'شست‌وشوی دستی توصیه می‌شود',
    rating: 4.8,
    reviews: 158,
    tags: ['cotton', 'new', 'recommended'],
    createdAt: '2026-10-30',
    popularity: 82,
    highlights: ['کمر بلند', 'فرم ملایم', 'بدون درز'],
    stock: { cream: [13, 11, 7, 4], blush: [8, 7, 4, 2], charcoal: [5, 4, 2, 0] },
  },
];

export const PRODUCTS: Product[] = DEFS.map(build);

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const productsByCategory = (category: string) => PRODUCTS.filter((p) => p.category === category);

/** soft, human ordering helpers */
export const newArrivals = (limit = 8) =>
  [...PRODUCTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);

export const bestSellers = (limit = 8) =>
  [...PRODUCTS]
    .filter((p) => p.tags.includes('bestseller'))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);

export const recommendations = (limit = 4, exclude?: string) =>
  [...PRODUCTS]
    .filter((p) => p.slug !== exclude && p.tags.includes('recommended'))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);

export const relatedProducts = (product: Product, limit = 4) =>
  [...PRODUCTS]
    .filter((p) => p.slug !== product.slug)
    .map((p) => ({
      p,
      score:
        (p.category === product.category ? 3 : 0) +
        (p.audience === product.audience ? 1 : 0) +
        p.colors.filter((c) => product.colors.includes(c)).length * 0.4 +
        p.rating / 10,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);

/* stock helpers used across cards, PDP, admin */
export const totalStock = (p: Product) => p.variants.reduce((s, v) => s + v.stock, 0);
export const variantStock = (p: Product, color: string, size: string) =>
  p.variants.find((v) => v.color === color && v.size === size)?.stock ?? 0;
export const colorStock = (p: Product, color: string) =>
  p.variants.filter((v) => v.color === color).reduce((s, v) => s + v.stock, 0);
export const colorHasStock = (p: Product, color: string) => colorStock(p, color) > 0;
export const availableSizes = (p: Product, color: string) =>
  p.sizes.filter((s) => variantStock(p, color, s) > 0);

export const LOW_STOCK = 5;
export const isLowStock = (n: number) => n > 0 && n <= LOW_STOCK;

/** price range across catalog, for the filter slider */
export const PRICE_BOUNDS = {
  min: Math.min(...PRODUCTS.map((p) => p.price)),
  max: Math.max(...PRODUCTS.map((p) => p.price)),
};

export { SHOT };

/* ─────────────────────────── reviews (mock) ─────────────────────────── */
const REVIEW_AUTHORS = ['نگار ک.', 'مریم ص.', 'سحر ر.', 'الهام ن.', 'پریسا ب.', 'زهرا م.', 'شیوا ت.', 'آیدا ح.'];
const REVIEW_BODIES: Record<Product['category'], string[]> = {
  socks: [
    'بعد از ده بار شست‌وشو هنوز فرمش را نگه داشته. کشی مچ واقعاً بدون فشار است، چیزی که همیشه دنبالش بودم.',
    'ضخامتش دقیقاً همان چیزی است که برای کفش‌های لوفر می‌خواستم. جنس نخی‌اش نفس می‌کشد.',
    'برای هدیه گرفتم و بسته‌بندی خیلی تمیز بود. رنگ کرمش با همه‌چیز ست می‌شود.',
  ],
  tights: [
    'هم‌رنگ پوستم است، نه نارنجی نه خاکستری. کمرش زیر شلوار تنگ هم دیده نمی‌شود.',
    'یک ماه استفادهٔ روزمره و هنوز سوراخ یا کشیدگی ندارد. کیفیت نسبت به قیمت خیلی خوب است.',
    'برای مجالس عالی بود؛ درخششش ملایم است و اصلاً مصنوعی به نظر نمی‌رسد.',
  ],
  hair: [
    'اسکرانچی خیلی نرم است و موقع باز کردن مو را نمی‌کشد. حجمش برای موهای پرپشت من مناسب بود.',
    'دوختش تمیز و بی‌اضافه است. رنگ سبز مریم‌گلی‌اش در واقعیت خیلی لطیف‌تر از عکس است.',
    'برای دوستم گرفتم و او هم بلافاصله سفارش داد. کیفیت ساتنش واقعاً حس گران‌قیمت بودن می‌دهد.',
  ],
  underwear: [
    'بی‌درزش زیر شلوار خط نمی‌اندازد و اصلاً حس نمی‌شود. سه‌تایی گرفتم و راضی‌ام.',
    'پنبه‌اش ضخیم و نرم است، نه نازک و شفاف. بعد از چند بار شست‌وشو رنگش هم نپریده.',
    'برای سفر و روزهای کاری خریدم؛ دوخت تختش واقعاً تفاوت دارد.',
  ],
};
const REVIEW_LABELS = ['دو هفته پیش', 'یک ماه پیش', 'دو ماه پیش'];

export function reviewsFor(product: Product): Review[] {
  const bodies = REVIEW_BODIES[product.category];
  const rand = seeded(product.slug + 'rev');
  return bodies.map((body, i) => {
    const r = rand();
    return {
      id: `${product.slug}-r${i}`,
      productSlug: product.slug,
      author: REVIEW_AUTHORS[(i + Math.floor(r * 5)) % REVIEW_AUTHORS.length],
      rating: 5 - (i === 2 && r > 0.6 ? 1 : 0),
      date: REVIEW_LABELS[i % REVIEW_LABELS.length],
      body,
      verified: true,
    };
  });
}

/** stock matrix used by PDP + admin: color → size → stock */
export function stockMatrixOf(product: Product): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const c of product.colors) {
    matrix[c] = {};
    for (const s of product.sizes) {
      matrix[c][s] = product.variants.find((v) => v.color === c && v.size === s)?.stock ?? 0;
    }
  }
  return matrix;
}

export type { Review };
