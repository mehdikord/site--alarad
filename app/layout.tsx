import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/providers';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { ToastHost } from '@/components/layout/toast-host';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';

export const metadata: Metadata = {
  metadataBase: new URL('https://alarad.shop'),
  title: {
    default: 'الاردشاپ — جوراب، جوراب‌شلواری و اکسسوری مو',
    template: '%s | الاردشاپ',
  },
  description:
    'الاردشاپ؛ فروشگاه آنلاین جوراب، جوراب‌شلواری، اکسسوری مو و پوشاک زیرهٔ زنانه، مردانه و کودکان. الیاف نخی نرم، رنگ‌های آرام و ارسال سریع به سراسر ایران.',
  keywords: ['جوراب زنانه', 'جوراب شلواری', 'اکسسوری مو', 'شورت زنانه', 'الاردشاپ', 'فروشگاه اینترنتی'],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'الاردشاپ',
    title: 'الاردشاپ — لطافت در هر قدم',
    description: 'جوراب، جوراب‌شلواری، اکسسوری مو و پوشاک زیره با الیاف نخی نرم و رنگ‌های آرام.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'الاردشاپ' }],
  },
  twitter: { card: 'summary_large_image', title: 'الاردشاپ', images: ['/og.jpg'] },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#F8F4F0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/vazirmatn-arabic-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:text-cream-50"
          >
            رفتن به محتوای اصلی
          </a>
          <SiteHeader />
          <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">
            {children}
          </main>
          <SiteFooter />
          <MobileTabBar />
          <CartDrawer />
          <ToastHost />
        </Providers>
      </body>
    </html>
  );
}
