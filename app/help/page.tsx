import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpContent } from '@/components/marketing/help-content';

export const metadata: Metadata = {
  title: 'راهنمای خرید و پشتیبانی',
  description: 'راهنمای سایزبندی، شرایط ارسال، بازگشت کالا و پاسخ سؤال‌های پرتکرار الاردشاپ.',
};

export default function HelpPage() {
  return (
    <div className="container-x max-w-4xl pt-6 sm:pt-10">
      <nav aria-label="مسیر" className="mb-4 flex items-center gap-1.5 text-[0.6875rem] text-ink-300">
        <Link href="/" className="hover:text-ink-700">خانه</Link>
        <span>/</span>
        <span className="text-ink-500">راهنما</span>
      </nav>
      <p className="eyebrow mb-2">پشتیبانی</p>
      <h1 className="text-h1 text-ink-900 sm:text-[2rem]">راهنمای خرید، سایز و ارسال</h1>
      <p className="prose-fa mt-3 max-w-2xl text-[0.8125rem] sm:text-sm">
        هر چیزی که برای یک خرید مطمئن لازم دارید — از انتخاب سایز درست تا پیگیری مرسوله. اگر پاسخ سؤال‌تان اینجا نبود،
        پشتیبانی ما هر روز از ۹ تا ۲۱ پاسخ می‌دهد.
      </p>
      <HelpContent />
    </div>
  );
}
