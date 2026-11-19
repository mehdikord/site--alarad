import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { getCategoryTree } from '@/lib/services/catalog';
import { getSettings } from '@/lib/settings';
import { StoreConfigProvider } from '@/components/layout/store-config';

// storefront reads live data from MySQL
export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([getCategoryTree(), getSettings()]);
  return (
    <StoreConfigProvider value={{ freeShippingThreshold: settings.freeShippingThreshold, taxRate: settings.taxRate }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:text-cream-50"
      >
        رفتن به محتوای اصلی
      </a>
      <SiteHeader categories={categories} freeShippingThreshold={settings.freeShippingThreshold} />
      <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">
        {children}
      </main>
      <SiteFooter categories={categories} settings={{ phone: settings.storePhone, email: settings.storeEmail, hours: settings.supportHours }} />
      <MobileTabBar />
      <CartDrawer />
    </StoreConfigProvider>
  );
}
