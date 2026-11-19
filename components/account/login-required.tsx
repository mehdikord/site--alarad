'use client';

import { useRouter } from 'next/navigation';
import { User as UserIcon } from 'lucide-react';
import { OtpLogin } from '@/components/account/otp-login';

/** inline sign-in for server pages that need a customer session */
export function LoginRequired({ title, description }: { title: string; description?: string }) {
  const router = useRouter();
  return (
    <div className="container-x max-w-md py-10 sm:py-14">
      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-cream-200 text-ink-600">
          <UserIcon className="size-5" strokeWidth={1.6} />
        </span>
        <h1 className="mt-4 text-h1 text-ink-900">{title}</h1>
        <p className="mt-2 text-[0.8125rem] leading-[1.9] text-ink-500">
          {description ?? 'با شمارهٔ همراهی که سفارش را با آن ثبت کرده‌اید وارد شوید.'}
        </p>
      </div>
      <div className="mt-6 rounded-xl border border-line-soft bg-white p-5 shadow-soft sm:p-6">
        <OtpLogin onDone={() => router.refresh()} />
      </div>
    </div>
  );
}
