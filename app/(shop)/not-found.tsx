import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <span className="text-[0.6875rem] tracking-[0.3em] text-ink-300">۴۰۴</span>
      <h1 className="mt-3 text-h1 text-ink-900">این صفحه پیدا نشد</h1>
      <p className="mt-2 text-[0.8125rem] leading-[1.95] text-ink-500">
        ممکن است نشانی تغییر کرده باشد یا محصول از کالکشن خارج شده باشد. از دسته‌های زیر ادامه دهید.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[
          { href: '/shop/socks', label: 'جوراب' },
          { href: '/shop/tights', label: 'جوراب‌شلواری' },
          { href: '/shop/hair', label: 'اکسسوری مو' },
          { href: '/shop/underwear', label: 'شورت' },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-[0.75rem] text-ink-600 transition-colors hover:border-sage-400 hover:text-sage-700"
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <ButtonLink href="/" variant="primary" size="md">بازگشت به خانه</ButtonLink>
      </div>
    </div>
  );
}
