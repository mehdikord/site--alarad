'use client';

import { Printer } from 'lucide-react';
import { adminBtn } from '@/components/admin/form';

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={adminBtn('primary')}>
      <Printer className="size-4" strokeWidth={1.8} />
      چاپ فاکتور
    </button>
  );
}
