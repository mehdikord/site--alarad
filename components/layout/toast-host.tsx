'use client';

import { useUi } from '@/lib/store';
import { ToastHost as Host } from '@/components/ui/misc';

export function ToastHost() {
  const toast = useUi((s) => s.toast);
  const dismiss = useUi((s) => s.dismiss);
  return <Host toast={toast} onDismiss={dismiss} />;
}
