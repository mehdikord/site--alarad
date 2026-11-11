import type { ColorOption, SizeOption, ShippingMethod } from '@/lib/types';

/**
 * Palette — every colour is muted and fabric-like. `hex` drives swatches,
 * the image pipeline derives tinted photography from the same family.
 */
export const COLORS: Record<string, ColorOption> = {
  cream: { key: 'cream', name: 'کرم', hex: '#F1E7DA', swatch: 'linear-gradient(145deg,#FBF5EC,#EEE0CF)' },
  oat: { key: 'oat', name: 'شیری', hex: '#E3D5C3', swatch: 'linear-gradient(145deg,#EDE2D2,#D8C6AE)' },
  sage: { key: 'sage', name: 'سبز مریم‌گلی', hex: '#B9C4AF', swatch: 'linear-gradient(145deg,#C9D2BF,#A2B096)' },
  blush: { key: 'blush', name: 'صورتی پودری', hex: '#EBD3CB', swatch: 'linear-gradient(145deg,#F5E2DA,#E2C5BA)' },
  rose: { key: 'rose', name: 'گلبهی', hex: '#D9B3A8', swatch: 'linear-gradient(145deg,#E7C6BB,#CBA396)' },
  dove: { key: 'dove', name: 'طوسی روشن', hex: '#CFCAC4', swatch: 'linear-gradient(145deg,#DCD7D1,#BFB8B0)' },
  charcoal: { key: 'charcoal', name: 'زغالی', hex: '#4A443F', swatch: 'linear-gradient(145deg,#5A534D,#38332F)' },
  black: { key: 'black', name: 'مشکی', hex: '#2C2825', swatch: 'linear-gradient(145deg,#3A3532,#211E1C)' },
  navy: { key: 'navy', name: 'سرمه‌ای', hex: '#3E4653', swatch: 'linear-gradient(145deg,#4A5462,#313945)' },
};

export const colorOf = (key: string): ColorOption => COLORS[key] ?? COLORS.cream;

/** Size sets per category / fit family. */
export const SIZE_SETS = {
  sock: [
    { key: 'festival', label: '۳۶ – ۴۰', note: 'مناسب سایز پای ۳۶ تا ۴۰' },
    { key: 'standard', label: '۴۰ – ۴۴', note: 'مناسب سایز پای ۴۰ تا ۴۴' },
  ],
  sockKids: [
    { key: 'kids-s', label: '۱ – ۳ سال' },
    { key: 'kids-m', label: '۴ – ۶ سال' },
    { key: 'kids-l', label: '۷ – ۱۰ سال' },
  ],
  tights: [
    { key: 's', label: 'S', note: 'قد ۱۵۰ تا ۱۶۰ سانتی‌متر' },
    { key: 'm', label: 'M', note: 'قد ۱۶۰ تا ۱۷۰ سانتی‌متر' },
    { key: 'l', label: 'L', note: 'قد ۱۷۰ تا ۱۸۰ سانتی‌متر' },
    { key: 'xl', label: 'XL', note: 'قد بالای ۱۸۰ سانتی‌متر' },
  ],
  briefs: [
    { key: 's', label: 'S', note: 'دور باسن ۸۶ تا ۹۲' },
    { key: 'm', label: 'M', note: 'دور باسن ۹۲ تا ۹۸' },
    { key: 'l', label: 'L', note: 'دور باسن ۹۸ تا ۱۰۶' },
    { key: 'xl', label: 'XL', note: 'دور باسن ۱۰۶ تا ۱۱۴' },
  ],
  boxer: [
    { key: 'm', label: 'M', note: 'دور کمر ۷۶ تا ۸۴' },
    { key: 'l', label: 'L', note: 'دور کمر ۸۴ تا ۹۲' },
    { key: 'xl', label: 'XL', note: 'دور کمر ۹۲ تا ۱۰۰' },
    { key: 'xxl', label: 'XXL', note: 'دور کمر ۱۰۰ تا ۱۰۸' },
  ],
  hair: [{ key: 'one', label: 'یک اندازه' }],
} satisfies Record<string, SizeOption[]>;

export const ALL_SIZES: SizeOption[] = Object.values(SIZE_SETS)
  .flat()
  .filter((s, i, arr) => arr.findIndex((x) => x.key === s.key) === i);

export const sizeLabel = (key: string) => ALL_SIZES.find((s) => s.key === key)?.label ?? key;
export const sizeNote = (key: string) => ALL_SIZES.find((s) => s.key === key)?.note;

/** Shipping — free above threshold, RTL-friendly copy. */
export const FREE_SHIPPING_THRESHOLD = 500_000;
export const TAX_RATE = 0.09;

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    title: 'پست پیشتاز',
    cost: 49_000,
    eta: '۲ تا ۴ روز کاری',
    description: 'ارسال به تمام نقاط کشور با کد رهگیری',
  },
  {
    id: 'express',
    title: 'ارسال سریع تهران',
    cost: 89_000,
    eta: 'همان روز (سفارش تا ساعت ۱۲)',
    description: 'ویژه تهران و کرج، پیک اختصاصی',
  },
  {
    id: 'pickup',
    title: 'تحویل حضوری',
    cost: 0,
    eta: 'آماده‌سازی ۲ ساعته',
    description: 'دریافت از بوتیک الاردشاپ — تهران، خیابان ولیعصر',
  },
];

export const COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; max?: number; label: string }> = {
  ALARAD10: { type: 'percent', value: 10, label: '۱۰٪ تخفیف خرید اول' },
  WELCOME15: { type: 'percent', value: 15, max: 150_000, label: '۱۵٪ تخفیف خوش‌آمدگویی' },
  SPRING50: { type: 'fixed', value: 50_000, label: '۵۰٬۰۰۰ تومان تخفیف' },
};

export const PROVINCES = [
  'تهران', 'البرز', 'اصفهان', 'خراسان رضوی', 'فارس', 'آذربایجان شرقی', 'آذربایجان غربی',
  'خوزستان', 'گیلان', 'مازندران', 'کرمان', 'یزد', 'قم', 'قزوین', 'مرکزی', 'همدان',
  'کرمانشاه', 'گلستان', 'سیستان و بلوچستان', 'هرمزگان', 'بوشهر', 'اردبیل', 'زنجان',
  'لرستان', 'کردستان', 'چهارمحال و بختیاری', 'کهگیلویه و بویراحمد', 'سمنان', 'ایلام',
  'خراسان شمالی', 'خراسان جنوبی',
];

export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  تهران: ['تهران', 'شهریار', 'اسلامشهر', 'ورامین', 'رباط‌کریم', 'پاکدشت', 'قرچک', 'پردیس'],
  البرز: ['کرج', 'فردیس', 'هشتگرد', 'نظرآباد', 'اشتهارد'],
  اصفهان: ['اصفهان', 'کاشان', 'خمینی‌شهر', 'نجف‌آباد', 'شهرضا'],
  'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'قوچان'],
  فارس: ['شیراز', 'مرودشت', 'کازرون', 'جهرم', 'فسا'],
  گیلان: ['رشت', 'انزلی', 'لاهیجان', 'آستارا', 'رودسر'],
  مازندران: ['ساری', 'بابلسر', 'آمل', 'نوشهر', 'چالوس'],
};
