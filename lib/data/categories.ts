import type { Category } from '@/lib/types';

export const CATEGORIES: Category[] = [
  {
    slug: 'socks',
    name: 'جوراب',
    shortName: 'جوراب',
    tagline: 'لطافت در هر قدم',
    description:
      'جوراب‌های نخی و نیم‌بافت با الیاف پنبهٔ مصری و کشباف ماندگار؛ بدون فشار روی مچ پا و بدون گشادی بعد از شست‌وشو. از ساق کوتاه روزمره تا بافت گرم زمستانی.',
    image: '/images/cat-socks.webp',
    count: 10,
    accent: 'sage',
  },
  {
    slug: 'tights',
    name: 'جوراب‌شلواری',
    shortName: 'جوراب‌شلواری',
    tagline: 'ظریفی که می‌درخشد',
    description:
      'جوراب‌شلواری‌های شفاف ۲۰ تا ۶۰ دنیر با کمر کشی نامرئی و کاپسهٔ تقویت‌شده. هم‌رنگ پوست با درخشش ملایم برای روزهای کاری و شب‌های مهمانی.',
    image: '/images/cat-tights.webp',
    count: 10,
    accent: 'blush',
  },
  {
    slug: 'hair',
    name: 'اکسسوری مو',
    shortName: 'اکسسوری مو',
    tagline: 'جزئیاتِ فراموش‌نشدنی',
    description:
      'اسکرانچی ابریشم، گیرهٔ مرواریدنشان و کش‌های پارچه‌ای نرم؛ دست‌دوز با دوخت تمیز که مو را نمی‌شکند و حس تجملی روزمره می‌سازد.',
    image: '/images/cat-hair.webp',
    count: 8,
    accent: 'cream',
  },
  {
    slug: 'underwear',
    name: 'شورت و زیرپوش',
    shortName: 'شورت',
    tagline: 'راحتی‌ای که حس نمی‌شود',
    description:
      'شورت‌های پنبهٔ ارگانیک با کشی نرم و بی‌دردسر؛ برای زنان، مردان و کودکان. دوخت بدون درز اصطکاک، دوخت سرتاسری نرم و رنگ‌های آرام.',
    image: '/images/cat-underwear.webp',
    count: 10,
    accent: 'sage',
  },
];
