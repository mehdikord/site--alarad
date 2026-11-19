'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/lib/store';
import { adminBtn } from '@/components/admin/form';
import { StockPill } from '@/components/admin/ui';

export interface InventoryRow {
  id: number;
  productId: number;
  productName: string;
  image: string | null;
  category: string;
  colorName: string | null;
  colorSwatch: string | null;
  sizeLabel: string | null;
  sku: string;
  stock: number;
  isActive: boolean;
}

const faNum = new Intl.NumberFormat('fa-IR');

export function InventoryTable({
  rows,
  lowThreshold,
  save,
}: {
  rows: InventoryRow[];
  lowThreshold: number;
  save: (changes: { id: number; stock: number }[]) => Promise<{ ok: boolean; message: string }>;
}) {
  const router = useRouter();
  const notify = useUi((s) => s.notify);
  const [edits, setEdits] = React.useState<Record<number, number>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setEdits({}), [rows]);

  const changes = Object.entries(edits)
    .map(([id, stock]) => ({ id: Number(id), stock }))
    .filter((c) => rows.find((r) => r.id === c.id)?.stock !== c.stock);

  const setStock = (id: number, v: number) => setEdits((e) => ({ ...e, [id]: Math.max(0, Math.round(v)) }));

  const onSave = async () => {
    if (!changes.length) return;
    setSaving(true);
    const res = await save(changes).catch(() => ({ ok: false, message: 'ارتباط با سرور برقرار نشد.' }));
    setSaving(false);
    notify(res.message, res.ok ? 'success' : 'error');
    if (res.ok) router.refresh();
  };

  React.useEffect(() => {
    if (!changes.length) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [changes.length]);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-line-soft bg-white">
        <table className="w-full min-w-[720px] text-[0.8125rem]">
          <thead className="border-b border-line-soft bg-cream-100/70 text-[0.6875rem] text-ink-400">
            <tr>
              <th className="px-3 py-2.5 text-start font-medium">محصول</th>
              <th className="px-3 py-2.5 text-start font-medium">رنگ</th>
              <th className="px-3 py-2.5 text-start font-medium">سایز</th>
              <th className="px-3 py-2.5 text-start font-medium">SKU</th>
              <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
              <th className="px-3 py-2.5 text-start font-medium">موجودی</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-ink-400">
                  تنوعی با این شرایط پیدا نشد.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const value = edits[r.id] ?? r.stock;
              const changed = value !== r.stock;
              return (
                <tr key={r.id} className={cn('border-b border-line-soft last:border-0', changed && 'bg-sage-50/70', !r.isActive && 'text-ink-300')}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt="" className="size-9 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="size-9 shrink-0 rounded-md bg-cream-200" />
                      )}
                      <div className="min-w-0">
                        <Link href={`/admins/products/${r.productId}`} className="line-clamp-1 text-ink-900 hover:text-sage-700">
                          {r.productName}
                        </Link>
                        <p className="text-[0.625rem] text-ink-400">{r.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {r.colorName ? (
                      <span className="flex items-center gap-1.5 text-[0.75rem]">
                        <span className="size-4 rounded-full border border-white shadow-sm" style={{ background: r.colorSwatch ?? undefined }} />
                        {r.colorName}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-[0.75rem]">{r.sizeLabel ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-[0.6875rem] text-ink-500" dir="ltr">
                    {r.sku}
                  </td>
                  <td className="px-3 py-2">
                    {r.isActive ? <StockPill stock={value} /> : <span className="text-[0.6875rem]">غیرفعال</span>}
                    {r.isActive && value > 0 && value <= lowThreshold && <span className="ms-1 text-[0.625rem] text-blush-500">کم</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setStock(r.id, value - 1)} className="flex size-8 items-center justify-center rounded-md border border-line text-ink-500 hover:border-sage-400" aria-label="کم کردن">
                        <Minus className="size-3" />
                      </button>
                      <input
                        dir="ltr"
                        inputMode="numeric"
                        value={value}
                        onChange={(e) => {
                          const n = Number(e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, ''));
                          setStock(r.id, Number.isFinite(n) ? n : 0);
                        }}
                        className={cn(
                          'h-8 w-16 rounded-md border bg-white px-2 text-center text-[0.8125rem] outline-none focus:border-sage-400',
                          changed ? 'border-sage-500 font-medium text-sage-700' : 'border-line',
                        )}
                      />
                      <button type="button" onClick={() => setStock(r.id, value + 1)} className="flex size-8 items-center justify-center rounded-md border border-line text-ink-500 hover:border-sage-400" aria-label="افزودن">
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {changes.length > 0 && (
        <div className="sticky bottom-3 z-30 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sage-200 bg-white/95 p-3 shadow-float backdrop-blur">
          <span className="text-[0.8125rem] text-ink-700">{faNum.format(changes.length)} تغییر ذخیره نشده</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEdits({})} className={adminBtn('ghost', 'sm')}>
              <RotateCcw className="size-3.5" />
              بازنشانی
            </button>
            <button type="button" onClick={onSave} disabled={saving} className={adminBtn('primary', 'sm')}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              ذخیرهٔ تغییرات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
