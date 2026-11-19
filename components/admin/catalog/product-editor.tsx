'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Loader2, Plus, Trash2, Wand2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/lib/store';
import { Panel } from '@/components/admin/ui';
import { adminBtn, adminInput, FieldShell, Toggle } from '@/components/admin/form';
import { MediaPicker } from '@/components/admin/catalog/media-picker';
import {
  AUDIENCE_LABEL,
  STATUS_LABEL,
  type EditorOptions,
  type ImagePayload,
  type ProductPayload,
  type SaveProductResult,
  type VariantPayload,
} from '@/lib/admin/catalog/product-types';

const faNum = new Intl.NumberFormat('fa-IR');
const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const parseNum = (s: string) => {
  const v = toLatin(s).replace(/[^\d]/g, '');
  return v === '' ? null : Number(v);
};
const comboKey = (c: number | null, s: number | null) => `${c ?? 0}:${s ?? 0}`;

export function ProductEditor({
  initial,
  options,
  orderedVariantIds = [],
  save,
}: {
  initial: ProductPayload;
  options: EditorOptions;
  orderedVariantIds?: number[];
  save: (p: ProductPayload) => Promise<SaveProductResult>;
}) {
  const router = useRouter();
  const notify = useUi((s) => s.notify);
  const [p, setP] = React.useState<ProductPayload>(initial);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const set = <K extends keyof ProductPayload>(k: K, v: ProductPayload[K]) => {
    setP((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  /* ── variant selection state ── */
  const initialColors = React.useMemo(
    () => [...new Set(initial.variants.map((v) => v.colorId).filter((x): x is number => x !== null))],
    [initial.variants],
  );
  const initialSizes = React.useMemo(
    () => [...new Set(initial.variants.map((v) => v.sizeId).filter((x): x is number => x !== null))],
    [initial.variants],
  );
  const groups = React.useMemo(() => [...new Set(options.sizes.map((s) => s.sizeGroup))], [options.sizes]);
  const [colorIds, setColorIds] = React.useState<number[]>(initialColors);
  const [sizeIds, setSizeIds] = React.useState<number[]>(initialSizes);
  const [group, setGroup] = React.useState<string>(
    () => options.sizes.find((s) => s.id === initialSizes[0])?.sizeGroup ?? groups[0] ?? '',
  );
  const [skuPrefix, setSkuPrefix] = React.useState(() => {
    const first = initial.variants[0]?.sku;
    if (first) return first.split('-').slice(0, 3).join('-');
    return 'AL-NEW';
  });
  // per-combo row state (keeps edits when toggling chips)
  const [rows, setRows] = React.useState<Record<string, VariantPayload>>(() =>
    Object.fromEntries(initial.variants.map((v) => [comboKey(v.colorId, v.sizeId), v])),
  );
  const [bulkStock, setBulkStock] = React.useState('');

  const colorById = React.useMemo(() => new Map(options.colors.map((c) => [c.id, c])), [options.colors]);
  const sizeById = React.useMemo(() => new Map(options.sizes.map((s) => [s.id, s])), [options.sizes]);

  const autoSku = React.useCallback(
    (c: number | null, s: number | null) =>
      [skuPrefix.trim().toUpperCase() || 'AL', c ? colorById.get(c)?.key.slice(0, 3).toUpperCase() : null, s ? sizeById.get(s)?.key.toUpperCase() : null]
        .filter(Boolean)
        .join('-'),
    [skuPrefix, colorById, sizeById],
  );

  // the matrix = colours × sizes (empty side → single null)
  const matrix = React.useMemo(() => {
    const cs = colorIds.length ? colorIds : [null];
    const ss = sizeIds.length
      ? [...sizeIds].sort((a, b) => options.sizes.findIndex((x) => x.id === a) - options.sizes.findIndex((x) => x.id === b))
      : [null];
    const out: VariantPayload[] = [];
    for (const c of cs)
      for (const s of ss) {
        const k = comboKey(c, s);
        out.push(rows[k] ?? { id: null, colorId: c, sizeId: s, sku: autoSku(c, s), stock: 0, price: null, isActive: true });
      }
    return out;
  }, [colorIds, sizeIds, rows, autoSku, options.sizes]);

  const removedVariants = initial.variants.filter(
    (v) => v.id && !matrix.some((m) => comboKey(m.colorId, m.sizeId) === comboKey(v.colorId, v.sizeId)),
  );

  const updateRow = (v: VariantPayload, patch: Partial<VariantPayload>) => {
    setRows((prev) => ({ ...prev, [comboKey(v.colorId, v.sizeId)]: { ...v, ...patch } }));
    setDirty(true);
  };

  const toggleColor = (id: number) => {
    setColorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setDirty(true);
  };
  const toggleSize = (id: number) => {
    setSizeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setDirty(true);
  };

  /* ── images ── */
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= p.images.length || from === to) return;
    const next = [...p.images];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    set('images', next);
  };

  /* ── save ── */
  const onSave = async (statusOverride?: ProductPayload['status']) => {
    setSaving(true);
    setErrors({});
    const payload: ProductPayload = {
      ...p,
      status: statusOverride ?? p.status,
      variants: matrix.map((v) => ({ ...v, sku: v.sku.trim().toUpperCase() })),
      images: p.images.map(({ mediaId, colorId }) => ({ mediaId, colorId })),
      highlights: p.highlights.map((h) => h.trim()).filter(Boolean),
    };
    try {
      const res = await save(payload);
      notify(res.message, res.ok ? 'success' : 'error');
      if (!res.ok) {
        setErrors(res.errors ?? {});
        return;
      }
      setDirty(false);
      if (statusOverride) setP((prev) => ({ ...prev, status: statusOverride }));
      if (!p.id && res.id) router.replace(`/admins/products/${res.id}`);
      else router.refresh();
    } catch {
      notify('ارتباط با سرور برقرار نشد.', 'error');
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const err = (k: string) => errors[k];
  const variantErr = (i: number) => errors[`variants.${i}.sku`] ?? errors[`variants.${i}.stock`] ?? errors[`variants.${i}.price`];
  const totalStock = matrix.filter((v) => v.isActive).reduce((s, v) => s + v.stock, 0);
  const visibleSizes = options.sizes.filter((s) => s.sizeGroup === group || sizeIds.includes(s.id));
  const generalErrors = Object.entries(errors).filter(([k]) => !k.startsWith('variants.'));

  return (
    <div className="pb-24">
      {generalErrors.length > 0 && (
        <div className="mb-4 rounded-xl border border-blush-300 bg-blush-100/60 p-3 text-[0.75rem] text-blush-500">
          <ul className="list-inside list-disc space-y-0.5">
            {generalErrors.map(([k, m]) => (
              <li key={k}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          {/* ── basic ── */}
          <Panel title="اطلاعات اصلی">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldShell label="نام محصول" error={err('name')} required className="sm:col-span-2">
                <input className={cn(adminInput, err('name') && 'border-blush-300')} value={p.name} onChange={(e) => set('name', e.target.value)} />
              </FieldShell>
              <FieldShell label="زیرعنوان" hint="یک خط کوتاه زیر نام محصول">
                <input className={adminInput} value={p.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
              </FieldShell>
              <FieldShell label="نامک (slug)" error={err('slug')} hint="خالی = از روی نام ساخته می‌شود">
                <input dir="ltr" className={cn(adminInput, 'text-left', err('slug') && 'border-blush-300')} value={p.slug} onChange={(e) => set('slug', e.target.value)} />
              </FieldShell>
              <FieldShell label="توضیحات" hint="پاراگراف‌ها را با یک خط خالی از هم جدا کنید." className="sm:col-span-2">
                <textarea className={cn(adminInput, 'h-auto min-h-36 py-2.5 leading-7')} value={p.description} onChange={(e) => set('description', e.target.value)} />
              </FieldShell>
              <FieldShell label="جنس / الیاف">
                <input className={adminInput} value={p.material} onChange={(e) => set('material', e.target.value)} />
              </FieldShell>
              <FieldShell label="نگهداری و شست‌وشو">
                <input className={adminInput} value={p.care} onChange={(e) => set('care', e.target.value)} />
              </FieldShell>
              <FieldShell label="محل تولید">
                <input className={adminInput} value={p.origin} onChange={(e) => set('origin', e.target.value)} />
              </FieldShell>
              <FieldShell label="مخاطب">
                <select className={adminInput} value={p.audience} onChange={(e) => set('audience', e.target.value as ProductPayload['audience'])}>
                  {Object.entries(AUDIENCE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </FieldShell>
            </div>
          </Panel>

          {/* ── pricing ── */}
          <Panel title="قیمت‌گذاری" description="مبالغ به تومان؛ قیمت هر تنوع می‌تواند جداگانه تغییر کند.">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldShell label="قیمت فروش (تومان)" error={err('price')} required>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  className={cn(adminInput, 'text-left', err('price') && 'border-blush-300')}
                  value={p.price ? p.price.toLocaleString('en-US') : ''}
                  onChange={(e) => set('price', parseNum(e.target.value) ?? 0)}
                />
              </FieldShell>
              <FieldShell label="قیمت قبل از تخفیف" error={err('compareAtPrice')} hint="اختیاری — برای نمایش درصد تخفیف">
                <input
                  dir="ltr"
                  inputMode="numeric"
                  className={cn(adminInput, 'text-left', err('compareAtPrice') && 'border-blush-300')}
                  value={p.compareAtPrice ? p.compareAtPrice.toLocaleString('en-US') : ''}
                  onChange={(e) => set('compareAtPrice', parseNum(e.target.value))}
                />
              </FieldShell>
              {p.compareAtPrice && p.compareAtPrice > p.price && p.price > 0 ? (
                <p className="text-[0.75rem] text-sage-700 sm:col-span-2">
                  {faNum.format(Math.round((1 - p.price / p.compareAtPrice) * 100))}٪ تخفیف نمایش داده می‌شود.
                </p>
              ) : null}
            </div>
          </Panel>

          {/* ── images ── */}
          <Panel
            title="تصاویر محصول"
            description="ترتیب را با کشیدن یا فلش‌ها تغییر دهید؛ اولین تصویر هر رنگ، تصویر کارت محصول است."
            action={
              <button type="button" onClick={() => setPickerOpen(true)} className={adminBtn('outline', 'sm')}>
                <ImagePlus className="size-3.5" />
                افزودن از رسانه
              </button>
            }
          >
            {err('images') && <p className="mb-2 text-[0.75rem] text-blush-500">{err('images')}</p>}
            {p.images.length === 0 ? (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line bg-cream-50 py-10 text-ink-400 hover:border-sage-300"
              >
                <ImagePlus className="size-7" strokeWidth={1.5} />
                <span className="text-[0.8125rem]">انتخاب یا بارگذاری تصاویر</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {p.images.map((im, i) => (
                  <ImageCard
                    key={`${im.mediaId}-${i}`}
                    im={im}
                    index={i}
                    total={p.images.length}
                    colors={options.colors.filter((c) => colorIds.length === 0 || colorIds.includes(c.id) || c.id === im.colorId)}
                    dragging={dragIdx === i}
                    onDragStart={() => setDragIdx(i)}
                    onDragEnd={() => setDragIdx(null)}
                    onDropOn={() => dragIdx !== null && moveImage(dragIdx, i)}
                    onMove={(d) => moveImage(i, i + d)}
                    onRemove={() => set('images', p.images.filter((_, j) => j !== i))}
                    onColor={(colorId) => set('images', p.images.map((x, j) => (j === i ? { ...x, colorId } : x)))}
                  />
                ))}
              </div>
            )}
            <MediaPicker
              open={pickerOpen}
              multiple
              title="افزودن تصاویر محصول"
              confirmLabel="افزودن به گالری"
              onClose={() => setPickerOpen(false)}
              onSelect={(items) =>
                set('images', [
                  ...p.images,
                  ...items.filter((m) => !p.images.some((x) => x.mediaId === m.id)).map((m) => ({ mediaId: m.id, colorId: null, url: m.url })),
                ])
              }
            />
          </Panel>

          {/* ── variants ── */}
          <Panel title="تنوع‌ها و موجودی" description="رنگ‌ها و سایزها را انتخاب کنید تا جدول تنوع (رنگ × سایز) ساخته شود.">
            {err('variants') && <p className="mb-3 text-[0.75rem] text-blush-500">{err('variants')}</p>}
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[0.75rem] font-medium text-ink-700">رنگ‌ها {colorIds.length === 0 && <span className="font-normal text-ink-400">(بدون رنگ)</span>}</p>
                <div className="flex flex-wrap gap-1.5">
                  {options.colors.map((c) => {
                    const on = colorIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleColor(c.id)}
                        className={cn(
                          'flex h-8 items-center gap-1.5 rounded-full border ps-1.5 pe-3 text-[0.75rem] transition-colors',
                          on ? 'border-ink-900 bg-ink-900 text-cream-50' : 'border-line bg-white text-ink-600 hover:border-sage-400',
                        )}
                      >
                        <span className="size-5 rounded-full border border-white/70" style={{ background: c.swatch || c.hex }} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-[0.75rem] font-medium text-ink-700">سایزها</p>
                  <select value={group} onChange={(e) => setGroup(e.target.value)} className={cn(adminInput, 'h-8 w-auto py-0 text-[0.75rem]')}>
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        گروه {g}
                      </option>
                    ))}
                  </select>
                  {sizeIds.length === 0 && <span className="text-[0.6875rem] text-ink-400">(بدون سایز / یک اندازه)</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {visibleSizes.map((s) => {
                    const on = sizeIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSize(s.id)}
                        title={s.sizeGroup}
                        className={cn(
                          'h-8 min-w-12 rounded-lg border px-3 text-[0.75rem] transition-colors',
                          on ? 'border-ink-900 bg-ink-900 text-cream-50' : 'border-line bg-white text-ink-600 hover:border-sage-400',
                        )}
                      >
                        {s.label}
                        {s.sizeGroup !== group && <span className="ms-1 text-[0.5625rem] opacity-60">({s.sizeGroup})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2 rounded-lg bg-cream-100/80 p-2.5">
                <label className="block">
                  <span className="mb-1 block text-[0.6875rem] text-ink-500">پیشوند SKU</span>
                  <input dir="ltr" value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} className={cn(adminInput, 'h-8 w-36 text-left')} />
                </label>
                <button
                  type="button"
                  className={adminBtn('outline', 'sm')}
                  onClick={() => {
                    setRows((prev) => {
                      const next = { ...prev };
                      for (const v of matrix) next[comboKey(v.colorId, v.sizeId)] = { ...v, sku: autoSku(v.colorId, v.sizeId) };
                      return next;
                    });
                    setDirty(true);
                  }}
                >
                  <Wand2 className="size-3.5" />
                  ساخت SKU خودکار
                </button>
                <span className="mx-1 h-6 w-px bg-line" />
                <label className="block">
                  <span className="mb-1 block text-[0.6875rem] text-ink-500">موجودی همه</span>
                  <input dir="ltr" inputMode="numeric" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} className={cn(adminInput, 'h-8 w-20 text-left')} />
                </label>
                <button
                  type="button"
                  className={adminBtn('outline', 'sm')}
                  disabled={parseNum(bulkStock) === null}
                  onClick={() => {
                    const n = parseNum(bulkStock) ?? 0;
                    setRows((prev) => {
                      const next = { ...prev };
                      for (const v of matrix) next[comboKey(v.colorId, v.sizeId)] = { ...v, stock: n };
                      return next;
                    });
                    setDirty(true);
                  }}
                >
                  اعمال
                </button>
                <span className="ms-auto text-[0.6875rem] text-ink-500">
                  {faNum.format(matrix.length)} تنوع · موجودی کل {faNum.format(totalStock)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-line-soft">
                <table className="w-full min-w-[620px] text-[0.75rem]">
                  <thead className="bg-cream-100/70 text-[0.6875rem] text-ink-400">
                    <tr>
                      <th className="px-2.5 py-2 text-start font-medium">رنگ</th>
                      <th className="px-2.5 py-2 text-start font-medium">سایز</th>
                      <th className="px-2.5 py-2 text-start font-medium">SKU</th>
                      <th className="px-2.5 py-2 text-start font-medium">موجودی</th>
                      <th className="px-2.5 py-2 text-start font-medium">قیمت اختصاصی</th>
                      <th className="px-2.5 py-2 text-center font-medium">فعال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((v, i) => {
                      const c = v.colorId ? colorById.get(v.colorId) : null;
                      const s = v.sizeId ? sizeById.get(v.sizeId) : null;
                      const e = variantErr(i);
                      return (
                        <tr key={comboKey(v.colorId, v.sizeId)} className={cn('border-t border-line-soft', !v.isActive && 'bg-cream-50 text-ink-400')}>
                          <td className="px-2.5 py-1.5">
                            {c ? (
                              <span className="flex items-center gap-1.5">
                                <span className="size-4 rounded-full border border-white shadow-sm" style={{ background: c.swatch || c.hex }} />
                                {c.name}
                              </span>
                            ) : (
                              <span className="text-ink-300">—</span>
                            )}
                          </td>
                          <td className="px-2.5 py-1.5">{s ? s.label : <span className="text-ink-300">—</span>}</td>
                          <td className="px-2.5 py-1.5">
                            <input
                              dir="ltr"
                              value={v.sku}
                              onChange={(ev) => updateRow(v, { sku: ev.target.value.toUpperCase() })}
                              className={cn(adminInput, 'h-8 w-44 text-left font-mono text-[0.6875rem]', e && 'border-blush-300')}
                            />
                            {e && <p className="mt-0.5 text-[0.625rem] text-blush-500">{e}</p>}
                          </td>
                          <td className="px-2.5 py-1.5">
                            <input
                              dir="ltr"
                              inputMode="numeric"
                              value={v.stock}
                              onChange={(ev) => updateRow(v, { stock: parseNum(ev.target.value) ?? 0 })}
                              className={cn(adminInput, 'h-8 w-20 text-left', v.stock === 0 && 'text-blush-500')}
                            />
                          </td>
                          <td className="px-2.5 py-1.5">
                            <input
                              dir="ltr"
                              inputMode="numeric"
                              placeholder={p.price ? p.price.toLocaleString('en-US') : ''}
                              value={v.price ? v.price.toLocaleString('en-US') : ''}
                              onChange={(ev) => updateRow(v, { price: parseNum(ev.target.value) })}
                              className={cn(adminInput, 'h-8 w-28 text-left')}
                            />
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <input type="checkbox" checked={v.isActive} onChange={(ev) => updateRow(v, { isActive: ev.target.checked })} className="size-4 accent-[#71816B]" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {removedVariants.length > 0 && (
                <p className="rounded-lg bg-blush-100/60 px-3 py-2 text-[0.6875rem] leading-6 text-blush-500">
                  با ذخیره، {faNum.format(removedVariants.length)} تنوع قبلی حذف می‌شود
                  {removedVariants.some((v) => v.id && orderedVariantIds.includes(v.id)) && ' (تنوع‌هایی که در سفارش‌ها استفاده شده‌اند حذف نمی‌شوند و فقط غیرفعال می‌گردند)'}.
                </p>
              )}
            </div>
          </Panel>

          {/* ── seo ── */}
          <Panel title="سئو">
            <div className="grid gap-3">
              <FieldShell label="عنوان متا" hint={`${faNum.format(p.metaTitle.length)} نویسه`}>
                <input className={adminInput} value={p.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder={p.name} />
              </FieldShell>
              <FieldShell label="توضیح متا" hint={`${faNum.format(p.metaDescription.length)} از ۱۶۰ نویسهٔ پیشنهادی`}>
                <textarea className={cn(adminInput, 'h-auto min-h-20 py-2.5 leading-7')} maxLength={500} value={p.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} />
              </FieldShell>
            </div>
          </Panel>
        </div>

        {/* ── sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Panel title="انتشار">
            <div className="space-y-3">
              <FieldShell label="وضعیت">
                <select className={adminInput} value={p.status} onChange={(e) => set('status', e.target.value as ProductPayload['status'])}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <Toggle label="محصول ویژه" hint="در بخش «پیشنهاد الاردشاپ» نمایش داده می‌شود" checked={p.isFeatured} onChange={(v) => set('isFeatured', v)} />
              <div className="flex gap-2">
                <button type="button" disabled={saving} onClick={() => onSave()} className={cn(adminBtn('primary'), 'flex-1')}>
                  {saving && <Loader2 className="size-3.5 animate-spin" />}
                  {p.id ? 'ذخیرهٔ تغییرات' : 'ساخت محصول'}
                </button>
                {p.status !== 'active' && (
                  <button type="button" disabled={saving} onClick={() => onSave('active')} className={adminBtn('sage')}>
                    انتشار
                  </button>
                )}
              </div>
              {dirty && <p className="text-[0.6875rem] text-blush-500">تغییرات ذخیره نشده دارید.</p>}
            </div>
          </Panel>

          <Panel title="دسته‌بندی">
            <FieldShell error={err('categoryId')}>
              <select
                className={cn(adminInput, err('categoryId') && 'border-blush-300')}
                value={p.categoryId ?? ''}
                onChange={(e) => set('categoryId', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— انتخاب دسته —</option>
                {options.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'  '.repeat(c.depth * 2)}
                    {c.depth > 0 ? '└ ' : ''}
                    {c.name}
                    {!c.isActive ? ' (غیرفعال)' : ''}
                  </option>
                ))}
              </select>
            </FieldShell>
            <Link href="/admins/categories/new" target="_blank" className="mt-2 inline-block text-[0.6875rem] text-sage-700 underline underline-offset-4">
              دستهٔ جدید
            </Link>
          </Panel>

          <Panel title="برچسب‌ها">
            {err('tagIds') && <p className="mb-2 text-[0.6875rem] text-blush-500">{err('tagIds')}</p>}
            <div className="flex flex-wrap gap-1.5">
              {options.tags.map((t) => {
                const on = p.tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set('tagIds', on ? p.tagIds.filter((x) => x !== t.id) : [...p.tagIds, t.id])}
                    className={cn(
                      'h-7 rounded-full border px-2.5 text-[0.6875rem] transition-colors',
                      on ? 'border-sage-500 bg-sage-100 text-sage-700' : 'border-line bg-white text-ink-500 hover:border-sage-300',
                    )}
                  >
                    {t.name}
                  </button>
                );
              })}
              {options.tags.length === 0 && <p className="text-[0.6875rem] text-ink-400">برچسبی تعریف نشده است.</p>}
            </div>
          </Panel>

          <Panel title="ویژگی‌های برجسته" description="به شکل نشان‌های کوچک در صفحهٔ محصول">
            <div className="space-y-1.5">
              {p.highlights.map((h, i) => (
                <div key={i} className="flex gap-1.5">
                  <input
                    className={cn(adminInput, 'h-9')}
                    value={h}
                    onChange={(e) => set('highlights', p.highlights.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                  <button
                    type="button"
                    aria-label="حذف"
                    onClick={() => set('highlights', p.highlights.filter((_, j) => j !== i))}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-blush-100 hover:text-blush-500"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set('highlights', [...p.highlights, ''])} className={adminBtn('ghost', 'sm')}>
                <Plus className="size-3.5" />
                افزودن ویژگی
              </button>
            </div>
          </Panel>
        </div>
      </div>

      {/* sticky save bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-cream-50/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <button type="button" disabled={saving} onClick={() => onSave()} className={cn(adminBtn('primary'), 'w-full')}>
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          {p.id ? 'ذخیرهٔ تغییرات' : 'ساخت محصول'}
        </button>
      </div>
    </div>
  );
}

function ImageCard({
  im,
  index,
  total,
  colors,
  dragging,
  onDragStart,
  onDragEnd,
  onDropOn,
  onMove,
  onRemove,
  onColor,
}: {
  im: ImagePayload;
  index: number;
  total: number;
  colors: EditorOptions['colors'];
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: () => void;
  onMove: (d: number) => void;
  onRemove: () => void;
  onColor: (id: number | null) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOn();
      }}
      className={cn('overflow-hidden rounded-lg border bg-white transition-opacity', dragging ? 'border-sage-400 opacity-50' : 'border-line-soft')}
    >
      <div className="relative aspect-[4/5] bg-cream-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {im.url && <img src={im.url} alt="" className="size-full object-cover" draggable={false} />}
        <span className="absolute start-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-cream-50/90 px-1.5 py-0.5 text-[0.625rem] text-ink-600">
          <GripVertical className="size-3 cursor-grab" />
          {faNum.format(index + 1)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="حذف تصویر"
          className="absolute end-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-cream-50/90 text-ink-500 hover:bg-blush-100 hover:text-blush-500"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
      <div className="flex items-center gap-1 p-1.5">
        <select
          value={im.colorId ?? ''}
          onChange={(e) => onColor(e.target.value ? Number(e.target.value) : null)}
          className="h-7 min-w-0 flex-1 rounded-md border border-line bg-white px-1.5 text-[0.6875rem] outline-none focus:border-sage-400"
          aria-label="رنگ تصویر"
        >
          <option value="">همهٔ رنگ‌ها</option>
          {colors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="جلوتر" className="flex size-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 disabled:opacity-30">
          <ArrowUp className="size-3" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="عقب‌تر" className="flex size-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 disabled:opacity-30">
          <ArrowDown className="size-3" />
        </button>
      </div>
    </div>
  );
}
