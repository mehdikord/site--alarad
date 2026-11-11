'use client';

import * as React from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NewsletterForm() {
  const [email, setEmail] = React.useState('');
  const [done, setDone] = React.useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setDone(true);
        setEmail('');
      }}
      className="relative"
    >
      <div className="flex items-center gap-2 rounded-full border border-line bg-white p-1 transition-colors duration-300 focus-within:border-sage-400">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="ایمیل یا شمارهٔ همراه"
          aria-label="ایمیل برای خبرنامه"
          className="h-9 min-w-0 flex-1 bg-transparent ps-3 text-[0.75rem] outline-none placeholder:text-ink-300"
        />
        <button
          type="submit"
          aria-label="عضویت در خبرنامه"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-cream-50 transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
        </button>
      </div>
      <AnimatePresence>
        {done && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-sage-700"
          >
            <Check className="size-3" strokeWidth={2.5} />
            ثبت شد؛ از تخفیف‌های آرام ما باخبر می‌شوید.
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
