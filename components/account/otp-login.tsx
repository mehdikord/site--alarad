'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api, useAuth, useUi } from '@/lib/store';
import { isValidIranPhone, normalizePhone, toLatinDigits } from '@/lib/format';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';

type Step = 'phone' | 'code' | 'name';

/** Phone → SMS code → (new users) name. Calls `onDone` once signed in. */
export function OtpLogin({ onDone, compact }: { onDone?: (user: User) => void; compact?: boolean }) {
  const setUser = useAuth((s) => s.setUser);
  const notify = useUi((s) => s.notify);
  const [step, setStep] = React.useState<Step>('phone');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [wait, setWait] = React.useState(0);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [pendingUser, setPendingUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidIranPhone(phone)) {
      setError('شمارهٔ همراه معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷).');
      return;
    }
    setBusy(true);
    setError('');
    const res = await api<{ devCode?: string; expiresIn?: number }>('/api/auth/otp/send', { phone: normalizePhone(phone) });
    setBusy(false);
    if (!res.ok) {
      setError(res.message ?? 'ارسال کد ناموفق بود.');
      return;
    }
    setDevCode(res.devCode ?? null);
    setStep('code');
    setWait(60);
    notify('کد تأیید پیامک شد.', 'success');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = toLatinDigits(code).replace(/\D/g, '');
    if (clean.length < 5) {
      setError('کد ۵ رقمی را کامل وارد کنید.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await api<{ user: User; isNew: boolean }>('/api/auth/otp/verify', { phone: normalizePhone(phone), code: clean });
    setBusy(false);
    if (!res.ok) {
      setError(res.message ?? 'کد تأیید اشتباه است.');
      return;
    }
    if (res.isNew || !res.user.name) {
      setPendingUser(res.user);
      setStep('name');
      return;
    }
    setUser(res.user);
    notify('خوش آمدید 🤍', 'success');
    onDone?.(res.user);
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    let user = pendingUser!;
    if (name.trim().length >= 2) {
      setBusy(true);
      const res = await api<{ user: User }>('/api/account/profile', { name: name.trim() }, 'PATCH');
      setBusy(false);
      if (res.ok) user = res.user;
    }
    setUser(user);
    notify('حساب شما ساخته شد. خوش آمدید 🤍', 'success');
    onDone?.(user);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === 'phone' && (
        <motion.form key="phone" onSubmit={send} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
          <Input
            label="شمارهٔ همراه"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            ltr
            inputMode="tel"
            autoComplete="tel"
            error={error}
            hint={compact ? undefined : 'کد تأیید یک‌بارمصرف برای این شماره پیامک می‌شود.'}
            autoFocus
          />
          <Button type="submit" size="lg" full loading={busy}>
            دریافت کد تأیید
          </Button>
        </motion.form>
      )}

      {step === 'code' && (
        <motion.form key="code" onSubmit={verify} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
          <div className="rounded-lg bg-cream-100 px-3 py-2 text-[0.6875rem] text-ink-500">
            کد برای <span dir="ltr">{normalizePhone(phone)}</span> ارسال شد.{' '}
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setCode('');
                setError('');
              }}
              className="text-sage-700 underline decoration-sage-300 underline-offset-4"
            >
              تغییر شماره
            </button>
          </div>
          {devCode && (
            <p className="rounded-lg border border-dashed border-sage-300 bg-sage-50 px-3 py-2 text-[0.6875rem] text-sage-700">
              حالت توسعه — کد تأیید: <span className="font-mono font-semibold" dir="ltr">{devCode}</span>
            </p>
          )}
          <Input
            label="کد تأیید ۵ رقمی"
            value={code}
            onChange={(e) => setCode(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 6))}
            ltr
            inputMode="numeric"
            autoComplete="one-time-code"
            error={error}
            autoFocus
          />
          <Button type="submit" size="lg" full loading={busy}>
            تأیید و ورود
          </Button>
          <button
            type="button"
            disabled={wait > 0 || busy}
            onClick={() => send()}
            className="block w-full text-center text-[0.6875rem] text-ink-400 transition-colors hover:text-sage-700 disabled:cursor-default disabled:hover:text-ink-400"
          >
            {wait > 0 ? `ارسال دوباره تا ${new Intl.NumberFormat('fa-IR').format(wait)} ثانیهٔ دیگر` : 'ارسال دوبارهٔ کد'}
          </button>
        </motion.form>
      )}

      {step === 'name' && (
        <motion.form key="name" onSubmit={saveName} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
          <p className="text-[0.8125rem] text-ink-600">به الاردشاپ خوش آمدید! نام خود را وارد کنید تا سفارش‌ها به نام شما ثبت شوند.</p>
          <Input label="نام و نام خانوادگی" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus />
          <Button type="submit" size="lg" full loading={busy}>
            ادامه
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
