import Link from 'next/link';
import { CATEGORIES } from '@/lib/data/categories';
import { NewsletterForm } from '@/components/layout/newsletter-form';

export function SiteFooter() {
  return <FooterInner />;
}

function FooterInner() {
  return (
    <footer className="mt-4 border-t border-line-soft bg-cream-100">
      <div className="container-x">
        {/* trust strip */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-b border-line-soft py-9 sm:grid-cols-4 sm:py-10">
          {[
            { title: 'الیاف طبیعی و نرم', body: 'پنبه، کتان و ابریشم با تأییدیهٔ کیفیت' },
            { title: 'ارسال سریع', body: '۲ تا ۴ روز کاری به سراسر ایران' },
            { title: 'بازگشت آسان', body: 'تا ۷ روز، بدون پرسش' },
            { title: 'پشتیبانی واقعی', body: 'پاسخ انسانی، هر روز ۹ تا ۲۱' },
          ].map((t) => (
            <div key={t.title} className="text-center sm:text-start">
              <p className="text-[0.8125rem] font-medium text-ink-900">{t.title}</p>
              <p className="mt-1 text-[0.6875rem] leading-[1.8] text-ink-400">{t.body}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* brand + newsletter */}
          <div>
            <p className="text-base font-semibold text-ink-900">الاردشاپ</p>
            <p className="mt-1 text-[0.5625rem] tracking-[0.32em] text-ink-300">A L A R A D</p>
            <p className="mt-4 max-w-xs text-[0.8125rem] leading-[1.95] text-ink-500">
              پوشاک زیره و اکسسوری‌هایی که لطافت را به روزمرگی می‌آورند. انتخاب الیاف نخی، رنگ‌های آرام و دوخت تمیز — بدون شلوغی.
            </p>
            <div className="mt-5 max-w-xs">
              <p className="mb-2 text-[0.75rem] text-ink-700">خبرنامهٔ آرام الاردشاپ</p>
              <NewsletterForm />
            </div>
          </div>

          <FooterCol
            title="خرید"
            links={CATEGORIES.map((c) => ({ label: c.name, href: `/shop/${c.slug}` })).concat([
              { label: 'همهٔ محصولات', href: '/shop' },
              { label: 'تازه‌ها', href: '/shop?tag=new' },
            ])}
          />

          <FooterCol
            title="حساب کاربری"
            links={[
              { label: 'ورود و ثبت‌نام', href: '/account' },
              { label: 'سفارش‌های من', href: '/account' },
              { label: 'پیگیری مرسوله', href: '/account' },
              { label: 'سبد خرید', href: '/cart' },
            ]}
          />

          <div>
            <p className="mb-3 text-[0.75rem] font-medium text-ink-900">پشتیبانی و راهنما</p>
            <ul className="space-y-2 text-[0.8125rem] text-ink-500">
              {[
                { label: 'راهنمای سایزبندی', href: '/help#sizes' },
                { label: 'شرایط ارسال', href: '/help#shipping' },
                { label: 'بازگشت و تعویض', href: '/help#returns' },
                { label: 'سؤالات پرتکرار', href: '/help' },
                { label: 'دربارهٔ ما', href: '/about' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-sage-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2">
              {['اینستاگرام', 'تلگرام', 'واتساپ'].map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-line px-2.5 py-1 text-[0.625rem] text-ink-400"
                  title={`${s} الاردشاپ`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line-soft py-6 sm:flex-row">
          <p className="text-[0.6875rem] text-ink-400">
            © ۱۴۰۵ الاردشاپ — تمام حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-4 text-[0.6875rem] text-ink-400">
            <span className="rounded-md border border-line bg-white px-2 py-1">پرداخت امن</span>
            <span className="rounded-md border border-line bg-white px-2 py-1">ضمانت اصالت</span>
            <span className="rounded-md border border-line bg-white px-2 py-1">۷ روز بازگشت</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-3 text-[0.75rem] font-medium text-ink-900">{title}</p>
      <ul className="space-y-2 text-[0.8125rem] text-ink-500">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="transition-colors hover:text-sage-700">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
