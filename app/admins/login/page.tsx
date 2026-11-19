import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'ورود مدیر | الاردشاپ', robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-ink-900 text-base font-semibold text-cream-50">ا</span>
          <h1 className="mt-4 text-[1.25rem] font-semibold text-ink-900">ورود به پنل مدیریت</h1>
          <p className="mt-1 text-[0.75rem] text-ink-400">با شمارهٔ موبایل و رمز عبور مدیر وارد شوید.</p>
        </div>
        <div className="rounded-2xl border border-line-soft bg-white p-5 shadow-soft sm:p-6">
          <LoginForm next={next ?? ''} />
        </div>
      </div>
    </div>
  );
}
