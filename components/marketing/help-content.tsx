'use client';

import * as React from 'react';
import { Accordion } from '@/components/ui/misc';
import { sizeLabel, sizeNote } from '@/lib/data/taxonomy';
import { SIZE_SETS } from '@/lib/data/taxonomy';

const SECTIONS = [
  { id: 'sizes', title: 'راهنمای سایزبندی' },
  { id: 'shipping', title: 'ارسال و تحویل' },
  { id: 'returns', title: 'بازگشت و تعویض' },
  { id: 'faq', title: 'سؤال‌های پرتکرار' },
];

export function HelpContent() {
  return (
    <div className="mt-8 grid gap-8 pb-10 lg:grid-cols-[200px_1fr]">
      <nav className="hidden lg:block">
        <ul className="sticky top-28 space-y-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block rounded-lg px-3 py-2 text-[0.75rem] text-ink-500 transition-colors hover:bg-cream-200 hover:text-ink-900"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        <section id="sizes" className="scroll-mt-24">
          <h2 className="text-h2 text-ink-900">{SECTIONS[0].title}</h2>
          <p className="mt-2 text-[0.8125rem] leading-[1.95] text-ink-500">
            اندازه‌ها بر اساس استانداردهای رایج ایرانی تنظیم شده‌اند. اگر بین دو سایز هستید، سایز بزرگ‌تر را انتخاب کنید؛
            کشباف الاردشاپ بعد از شست‌وشو جمع نمی‌شود.
          </p>

          <div className="mt-4 space-y-4">
            <SizeTable
              title="جوراب‌شلواری"
              caption="انتخاب بر اساس قد — کمر کشی برگشت‌پذیر تا ۱۵ سانتی‌متر"
              rows={SIZE_SETS.tights.map((s) => [sizeLabel(s.key), s.note ?? '—'])}
              head={['سایز', 'مناسب برای']}
            />
            <SizeTable
              title="شورت و زیرپوش زنانه"
              caption="انتخاب بر اساس دور باسن"
              rows={SIZE_SETS.briefs.map((s) => [sizeLabel(s.key), s.note ?? '—'])}
              head={['سایز', 'دور باسن (سانتی‌متر)']}
            />
            <SizeTable
              title="جوراب"
              caption="کشی ماندگار با بازهٔ پوشش دو سایز"
              rows={SIZE_SETS.sock.map((s) => [sizeLabel(s.key), s.note ?? '—'])}
              head={['سایز', 'مناسب برای']}
            />
            <SizeTable
              title="شورت مردانه"
              caption="انتخاب بر اساس دور کمر"
              rows={SIZE_SETS.boxer.map((s) => [sizeLabel(s.key), s.note ?? '—'])}
              head={['سایز', 'دور کمر (سانتی‌متر)']}
            />
          </div>
        </section>

        <section id="shipping" className="scroll-mt-24">
          <h2 className="text-h2 text-ink-900">{SECTIONS[1].title}</h2>
          <div className="mt-3 space-y-2.5 text-[0.8125rem] leading-[1.95] text-ink-500">
            <p>ارسال با پست پیشتاز ۲ تا ۴ روز کاری زمان می‌برد و هزینهٔ آن ۴۹٬۰۰۰ تومان است. برای سفارش‌های بالای ۵۰۰٬۰۰۰ تومان ارسال رایگان است.</p>
            <p>ارسال سریع تهران و کرج با پیک اختصاصی انجام می‌شود؛ سفارش‌های ثبت‌شده تا ساعت ۱۲ همان روز ارسال می‌شوند.</p>
            <p>همهٔ مرسوله‌ها با بسته‌بندی محرمانه و بدون نام فروشگاه ارسال می‌شوند. کد رهگیری پس از تحویل به پست، در بخش «سفارش‌های من» فعال می‌شود.</p>
          </div>
        </section>

        <section id="returns" className="scroll-mt-24">
          <h2 className="text-h2 text-ink-900">{SECTIONS[2].title}</h2>
          <div className="mt-3 space-y-2.5 text-[0.8125rem] leading-[1.95] text-ink-500">
            <p>تا ۷ روز پس از دریافت، در صورت باز نشدن بسته‌بندی بهداشتی، امکان بازگشت یا تعویض وجود دارد. هزینهٔ ارسال بازگشت با ماست.</p>
            <p>اگر کالایی معیوب یا نادرست ارسال شده باشد، تعویض در اولویت قرار می‌گیرد و هزینه‌ای پرداخت نمی‌کنید.</p>
            <p>برای شروع، در بخش «سفارش‌های من» سفارش را انتخاب و درخواست بازگشت را ثبت کنید.</p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24">
          <h2 className="text-h2 text-ink-900">{SECTIONS[3].title}</h2>
          <div className="mt-3 border-t border-line-soft">
            {[
              {
                q: 'جوراب‌شلواری بعد از چند بار شست‌وشو کش می‌آید؟',
                a: 'جوراب‌شلواری‌های الاردشاپ با الاستان باکیفیت بافته می‌شوند و در صورت شست‌وشوی دستی با آب سرد، بعد از ۲۰ بار استفاده فرم خود را نگه می‌دارند. از خشک‌کن و آب گرم استفاده نکنید.',
              },
              {
                q: 'چطور بفهمم رنگ کرم یا شیری مناسب پوستم است؟',
                a: 'جوراب‌شلواری‌های «کرم» برای پوست‌های روشن و «گلبهی» برای پوست‌های گرم‌تر مناسب‌تر است. در صفحهٔ محصول، تصویر هر رنگ را می‌بینید؛ اگر مطمئن نیستید، از پک تخفیف‌دار دو رنگ استفاده کنید.',
              },
              {
                q: 'پرداخت در محل برای همهٔ شهرها فعال است؟',
                a: 'پرداخت در محل فعلاً فقط برای تهران و کرج فعال است. برای سایر شهرها از درگاه پرداخت اینترنتی استفاده کنید.',
              },
              {
                q: 'کد تخفیف را کجا وارد کنم؟',
                a: 'در صفحهٔ سبد خرید یا مرحلهٔ پرداخت، بخش «کد تخفیف» را باز کنید و کد را وارد کنید. کدهای فعال: ALARAD10 و WELCOME15.',
              },
              {
                q: 'امکان خرید عمده یا همکاری وجود دارد؟',
                a: 'بله. برای سفارش‌های بالای ۵۰ عدد، قیمت‌گذاری ویژه داریم. از طریق فرم تماس در صفحهٔ «دربارهٔ ما» درخواست خود را ثبت کنید.',
              },
            ].map((f, i) => (
              <Accordion key={f.q} title={f.q} defaultOpen={i === 0}>
                {f.a}
              </Accordion>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SizeTable({ title, caption, head, rows }: { title: string; caption: string; head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
      <div className="border-b border-line-soft bg-cream-100/60 px-4 py-2.5">
        <p className="text-[0.75rem] font-medium text-ink-900">{title}</p>
        <p className="text-[0.625rem] text-ink-400">{caption}</p>
      </div>
      <table className="w-full text-[0.75rem]">
        <thead>
          <tr className="text-[0.625rem] text-ink-400">
            {head.map((h) => (
              <th key={h} className="px-4 py-2 text-start font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className={j === 0 ? 'px-4 py-2 font-medium text-ink-900' : 'px-4 py-2 text-ink-600'}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
