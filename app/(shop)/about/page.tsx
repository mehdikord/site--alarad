import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { blurOf } from '@/lib/images';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'دربارهٔ الاردشاپ',
  description: 'داستان الاردشاپ؛ انتخاب الیاف طبیعی، رنگ‌های آرام و دوخت تمیز برای پوشاک زیره و اکسسوری.',
};

export default function AboutPage() {
  return (
    <div>
      <section className="container-x pt-6 sm:pt-10">
        <nav aria-label="مسیر" className="mb-4 flex items-center gap-1.5 text-[0.6875rem] text-ink-300">
          <Link href="/" className="hover:text-ink-700">خانه</Link>
          <span>/</span>
          <span className="text-ink-500">دربارهٔ ما</span>
        </nav>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow mb-2.5">داستان ما</p>
            <h1 className="text-[1.75rem] font-semibold leading-[1.35] text-ink-900 sm:text-[2.25rem]">
              چیزهای ساده‌ای که هر روز لمس می‌کنیم،
              <span className="block text-ink-500">سزاوار کیفیت بهتری هستند.</span>
            </h1>
            <div className="prose-fa mt-4 space-y-3 text-[0.8125rem] sm:text-sm">
              <p>
                الاردشاپ از یک نیاز کوچک شروع شد: جورابی که بعد از سه بار شست‌وشو گشاد نشود، جوراب‌شلواری‌ای که رنگش
                با پوست هماهنگ باشد و اسکرانچی‌ای که مو را نشکند. چیزهایی که هر روز استفاده می‌کنیم اما کمتر درباره‌شان
                با دقت انتخاب می‌کنیم.
              </p>
              <p>
                ما با کارگاه‌های کوچک ایرانی کار می‌کنیم؛ الیاف را انتخاب می‌کنیم، رنگ‌ها را محدود نگه می‌داریم و بسته‌بندی
                را ساده و محرمانه طراحی می‌کنیم. نتیجه، مجموعه‌ای است که آرام به نظر می‌رسد و در استفاده، تفاوتش را نشان می‌دهد.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <ButtonLink href="/shop" variant="primary" size="md">مشاهدهٔ کالکشن</ButtonLink>
              <ButtonLink href="/help" variant="outline" size="md">راهنمای خرید</ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-cream-200 shadow-soft">
            <Image
              src="/images/editorial-tights.webp"
              alt="جوراب‌شلواری الاردشاپ"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              placeholder="blur"
              blurDataURL={blurOf('editorial-tights')}
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-x py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'الیاف انتخاب‌شده', body: 'پنبهٔ مصری و ارگانیک، پشم مرینوس و ابریشم — با انتخاب دقیق برای هر محصول.' },
            { title: 'رنگ‌های محدود', body: 'پالت کوچک و هماهنگ؛ تا هر قطعه با بقیهٔ لباس‌هایتان ست شود.' },
            { title: 'دوخت تمیز', body: 'بدون درز اضافه، بدون اصطکاک؛ جزئیاتی که فقط روی پوست حس می‌شود.' },
          ].map((v) => (
            <div key={v.title} className="rounded-xl border border-line-soft bg-white p-5">
              <p className="text-[0.8125rem] font-medium text-ink-900">{v.title}</p>
              <p className="mt-1.5 text-[0.75rem] leading-[1.95] text-ink-500">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-sage-50/80 p-6 sm:p-10">
          <p className="eyebrow mb-2">تماس</p>
          <h2 className="text-h2 text-ink-900">سؤالی دارید؟ بنویسید.</h2>
          <p className="prose-fa mt-2 text-[0.8125rem]">
            برای خرید عمده، همکاری یا هر پیشنهادی، از طریق صفحهٔ راهنما یا حساب اینستاگرام با ما در تماس باشید. هر روز از ۹ تا ۲۱ پاسخ می‌دهیم.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['اینستاگرام الاردشاپ', 'تلگرام', 'واتساپ'].map((s) => (
              <span key={s} className="rounded-full border border-line bg-white px-3 py-1.5 text-[0.6875rem] text-ink-600">{s}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
