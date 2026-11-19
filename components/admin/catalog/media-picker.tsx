'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, ImagePlus, Loader2, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/lib/store';
import type { MediaDTO } from '@/lib/media';
import { adminBtn, adminInput } from '@/components/admin/form';

/* ───────────────────────── helpers ───────────────────────── */

const faNum = new Intl.NumberFormat('fa-IR');
export function formatBytes(n: number) {
  if (n < 1024) return `${faNum.format(n)} بایت`;
  if (n < 1024 * 1024) return `${faNum.format(Math.round(n / 1024))} کیلوبایت`;
  return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(n / 1024 / 1024)} مگابایت`;
}

/** XHR upload with progress → created MediaDTOs */
export function useMediaUpload() {
  const notify = useUi((s) => s.notify);
  const [progress, setProgress] = React.useState<number | null>(null);

  const upload = React.useCallback(
    (files: File[] | FileList): Promise<MediaDTO[]> =>
      new Promise((resolve) => {
        const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
        if (!list.length) {
          notify('فقط فایل تصویری قابل بارگذاری است.', 'error');
          return resolve([]);
        }
        const fd = new FormData();
        list.forEach((f) => fd.append('files', f));
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/media');
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => {
          setProgress(null);
          let json: { ok?: boolean; items?: MediaDTO[]; errors?: { name: string; message: string }[]; message?: string } = {};
          try {
            json = JSON.parse(xhr.responseText);
          } catch {
            /* ignore */
          }
          const items = json.items ?? [];
          if (items.length) notify(json.message ?? 'بارگذاری انجام شد.', 'success');
          (json.errors ?? []).forEach((er) => notify(`${er.name}: ${er.message}`, 'error'));
          if (!items.length && !(json.errors ?? []).length) notify(json.message ?? 'بارگذاری ناموفق بود.', 'error');
          resolve(items);
        };
        xhr.onerror = () => {
          setProgress(null);
          notify('ارتباط با سرور برقرار نشد.', 'error');
          resolve([]);
        };
        setProgress(0);
        xhr.send(fd);
      }),
    [notify],
  );

  return { upload, progress, uploading: progress !== null };
}

/** paginated + searchable media list from /api/admin/media */
export function useMediaLibrary(take = 40, enabled = true) {
  const [items, setItems] = React.useState<MediaDTO[]>([]);
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const reqId = React.useRef(0);

  const load = React.useCallback(
    async (opts: { q: string; page: number; append: boolean }) => {
      const id = ++reqId.current;
      setLoading(true);
      try {
        const sp = new URLSearchParams({ q: opts.q, page: String(opts.page), take: String(take) });
        const res = await fetch(`/api/admin/media?${sp}`, { cache: 'no-store' });
        const json = (await res.json()) as { items: MediaDTO[]; total: number; pages: number };
        if (id !== reqId.current) return;
        setItems((prev) => (opts.append ? [...prev, ...json.items.filter((m) => !prev.some((p) => p.id === m.id))] : json.items));
        setPages(json.pages);
        setTotal(json.total);
        setPage(opts.page);
      } catch {
        /* keep previous */
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [take],
  );

  // debounced search
  React.useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => load({ q, page: 1, append: false }), q ? 280 : 0);
    return () => clearTimeout(t);
  }, [q, enabled, load]);

  return {
    items,
    setItems,
    q,
    setQ,
    page,
    pages,
    total,
    setTotal,
    loading,
    loadMore: () => page < pages && load({ q, page: page + 1, append: true }),
    reload: () => load({ q, page: 1, append: false }),
  };
}

/* ───────────────────────── dropzone ───────────────────────── */

export function Dropzone({
  onFiles,
  uploading,
  progress,
  compact,
  className,
}: {
  onFiles: (files: FileList) => void;
  uploading?: boolean;
  progress?: number | null;
  compact?: boolean;
  className?: string;
}) {
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      onClick={() => !uploading && input.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors',
        compact ? 'gap-1.5 px-4 py-5' : 'gap-2 px-6 py-12',
        over ? 'border-sage-500 bg-sage-50' : 'border-line bg-cream-50 hover:border-sage-300 hover:bg-white',
        className,
      )}
    >
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <>
          <Loader2 className="size-6 animate-spin text-sage-600" />
          <p className="text-[0.8125rem] text-ink-700">در حال بارگذاری… {progress !== null && progress !== undefined ? `${faNum.format(progress)}٪` : ''}</p>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-cream-200">
            <div className="h-full bg-sage-500 transition-[width]" style={{ width: `${progress ?? 0}%` }} />
          </div>
        </>
      ) : (
        <>
          <UploadCloud className={cn(compact ? 'size-5' : 'size-8', 'text-sage-600')} strokeWidth={1.6} />
          <p className="text-[0.8125rem] font-medium text-ink-800">فایل‌ها را اینجا رها کنید یا کلیک کنید</p>
          <p className="text-[0.6875rem] text-ink-400">JPG، PNG، WEBP، GIF یا AVIF — امکان انتخاب چند فایل</p>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── grid tile ───────────────────────── */

export function MediaTile({
  m,
  selected,
  focused,
  order,
  onClick,
}: {
  m: MediaDTO;
  selected?: boolean;
  focused?: boolean;
  order?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={m.originalName}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg border bg-cream-200 transition-all',
        selected ? 'border-sage-500 ring-2 ring-sage-500 ring-offset-2 ring-offset-white' : focused ? 'border-ink-400' : 'border-line-soft hover:border-sage-300',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.url} alt={m.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {selected && (
        <span className="absolute end-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-sage-600 text-[0.625rem] font-medium text-white shadow">
          {order ? faNum.format(order) : <Check className="size-3" strokeWidth={3} />}
        </span>
      )}
    </button>
  );
}

/* ───────────────────────── details panel ───────────────────────── */

export function MediaDetails({
  m,
  onSaved,
  onDeleted,
  allowDelete,
}: {
  m: MediaDTO;
  onSaved?: (m: MediaDTO) => void;
  onDeleted?: (id: number) => void;
  allowDelete?: boolean;
}) {
  const notify = useUi((s) => s.notify);
  const [alt, setAlt] = React.useState(m.alt);
  const [title, setTitle] = React.useState(m.title);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setAlt(m.alt);
    setTitle(m.title);
  }, [m.id, m.alt, m.title]);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/media/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt, title }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setSaving(false);
    notify(json.message ?? 'خطا در ذخیره', json.ok ? 'success' : 'error');
    if (json.ok) onSaved?.(json.item);
  };

  const remove = async () => {
    const warn = m.usage
      ? `این تصویر در ${faNum.format(m.usage)} جا (محصول/دسته‌بندی) استفاده شده است و از آن‌ها هم حذف می‌شود. حذف شود؟`
      : 'این فایل برای همیشه حذف شود؟';
    if (!window.confirm(warn)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/media/${m.id}`, { method: 'DELETE' }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setDeleting(false);
    notify(json.message ?? 'خطا در حذف', json.ok ? 'success' : 'error');
    if (json.ok) onDeleted?.(m.id);
  };

  const copy = async () => {
    const url = m.url.startsWith('http') ? m.url : `${window.location.origin}${m.url}`;
    await navigator.clipboard.writeText(url).catch(() => null);
    notify('نشانی فایل کپی شد.', 'success');
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-line-soft bg-cream-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.url} alt={m.alt} className="max-h-56 w-full object-contain" />
      </div>
      <dl className="space-y-1 text-[0.6875rem] text-ink-500">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-400">نام فایل</dt>
          <dd className="truncate text-ink-700" dir="ltr" title={m.originalName}>{m.originalName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-400">حجم</dt>
          <dd className="text-ink-700">{formatBytes(m.size)}</dd>
        </div>
        {m.width && m.height && (
          <div className="flex justify-between gap-2">
            <dt className="text-ink-400">ابعاد</dt>
            <dd className="text-ink-700" dir="ltr">{m.width} × {m.height}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-ink-400">نوع</dt>
          <dd className="text-ink-700" dir="ltr">{m.mimeType}</dd>
        </div>
        {m.usage !== undefined && (
          <div className="flex justify-between gap-2">
            <dt className="text-ink-400">استفاده</dt>
            <dd className="text-ink-700">{m.usage ? `${faNum.format(m.usage)} مورد` : 'استفاده نشده'}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-ink-400">تاریخ</dt>
          <dd className="text-ink-700">{new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium' }).format(new Date(m.createdAt))}</dd>
        </div>
      </dl>
      <label className="block">
        <span className="mb-1 block text-[0.6875rem] font-medium text-ink-600">متن جایگزین (alt)</span>
        <input value={alt} onChange={(e) => setAlt(e.target.value)} className={cn(adminInput, 'h-9')} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[0.6875rem] font-medium text-ink-600">عنوان</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={cn(adminInput, 'h-9')} />
      </label>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={save} disabled={saving} className={adminBtn('primary', 'sm')}>
          {saving && <Loader2 className="size-3 animate-spin" />}
          ذخیره
        </button>
        <button type="button" onClick={copy} className={adminBtn('outline', 'sm')}>
          کپی نشانی
        </button>
        {allowDelete && (
          <button type="button" onClick={remove} disabled={deleting} className={adminBtn('danger', 'sm')}>
            {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            حذف
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── the picker modal ───────────────────────── */

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  title = 'انتخاب تصویر',
  confirmLabel = 'انتخاب',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (items: MediaDTO[]) => void;
  multiple?: boolean;
  title?: string;
  confirmLabel?: string;
}) {
  const lib = useMediaLibrary(40, open);
  const { upload, progress, uploading } = useMediaUpload();
  const [tab, setTab] = React.useState<'library' | 'upload'>('library');
  const [selected, setSelected] = React.useState<MediaDTO[]>([]);
  const [focused, setFocused] = React.useState<MediaDTO | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (open) {
      setSelected([]);
      setFocused(null);
      setTab('library');
    }
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const toggle = (m: MediaDTO) => {
    setFocused(m);
    setSelected((prev) => {
      const has = prev.some((p) => p.id === m.id);
      if (!multiple) return has ? [] : [m];
      return has ? prev.filter((p) => p.id !== m.id) : [...prev, m];
    });
  };

  const handleFiles = async (files: FileList) => {
    const created = await upload(files);
    if (!created.length) return;
    lib.setItems((prev) => [...created, ...prev.filter((p) => !created.some((c) => c.id === p.id))]);
    lib.setTotal((t) => t + created.length);
    setSelected((prev) => (multiple ? [...prev, ...created] : [created[0]]));
    setFocused(created[0]);
    setTab('library');
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-6" dir="rtl" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-float sm:h-[86vh] sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3 sm:px-5">
          <div className="flex items-center gap-4">
            <h2 className="text-[0.9375rem] font-semibold text-ink-900">{title}</h2>
            <div className="flex gap-1 rounded-full bg-cream-100 p-1">
              {(
                [
                  ['library', 'کتابخانهٔ رسانه'],
                  ['upload', 'بارگذاری فایل'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={cn('rounded-full px-3 py-1.5 text-[0.75rem] transition-colors', tab === k ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-800')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="بستن" className="flex size-8 items-center justify-center rounded-full text-ink-400 hover:bg-cream-200 hover:text-ink-800">
            <X className="size-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1">
          {tab === 'upload' ? (
            <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
              <Dropzone onFiles={handleFiles} uploading={uploading} progress={progress} className="w-full max-w-2xl" />
            </div>
          ) : (
            <>
              <div
                className="flex min-w-0 flex-1 flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
                }}
              >
                <div className="flex items-center gap-2 border-b border-line-soft px-4 py-2.5 sm:px-5">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" />
                    <input
                      value={lib.q}
                      onChange={(e) => lib.setQ(e.target.value)}
                      placeholder="جست‌وجوی نام یا متن جایگزین…"
                      className={cn(adminInput, 'h-9 ps-8')}
                    />
                  </div>
                  <span className="text-[0.6875rem] text-ink-400">{faNum.format(lib.total)} فایل</span>
                  {uploading && (
                    <span className="flex items-center gap-1 text-[0.6875rem] text-sage-700">
                      <Loader2 className="size-3 animate-spin" />
                      {faNum.format(progress ?? 0)}٪
                    </span>
                  )}
                  <button type="button" onClick={() => setTab('upload')} className={cn(adminBtn('outline', 'sm'), 'ms-auto')}>
                    <ImagePlus className="size-3.5" />
                    <span className="hidden sm:inline">بارگذاری</span>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                  {lib.items.length === 0 && !lib.loading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <p className="text-[0.8125rem] text-ink-400">{lib.q ? 'فایلی با این عنوان پیدا نشد.' : 'هنوز فایلی بارگذاری نشده است.'}</p>
                      <Dropzone onFiles={handleFiles} uploading={uploading} progress={progress} compact className="w-full max-w-md" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-6">
                        {lib.items.map((m) => {
                          const idx = selected.findIndex((s) => s.id === m.id);
                          return (
                            <MediaTile
                              key={m.id}
                              m={m}
                              selected={idx !== -1}
                              order={multiple && idx !== -1 ? idx + 1 : undefined}
                              focused={focused?.id === m.id}
                              onClick={() => toggle(m)}
                            />
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-center">
                        {lib.loading ? (
                          <Loader2 className="size-5 animate-spin text-ink-300" />
                        ) : lib.page < lib.pages ? (
                          <button type="button" onClick={lib.loadMore} className={adminBtn('outline', 'sm')}>
                            نمایش بیشتر
                          </button>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <aside className="hidden w-72 shrink-0 overflow-y-auto border-s border-line-soft bg-cream-50/60 p-4 md:block">
                {focused ? (
                  <MediaDetails
                    m={focused}
                    onSaved={(m) => {
                      setFocused(m);
                      lib.setItems((prev) => prev.map((p) => (p.id === m.id ? m : p)));
                      setSelected((prev) => prev.map((p) => (p.id === m.id ? m : p)));
                    }}
                  />
                ) : (
                  <p className="pt-10 text-center text-[0.75rem] leading-6 text-ink-400">برای دیدن جزئیات، روی یک تصویر کلیک کنید.</p>
                )}
              </aside>
            </>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line-soft bg-cream-50/70 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {selected.length > 0 ? (
              <>
                <div className="flex -space-x-2 space-x-reverse">
                  {selected.slice(0, 5).map((s) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={s.id} src={s.url} alt="" className="size-8 rounded-md border-2 border-white object-cover" />
                  ))}
                </div>
                <span className="text-[0.75rem] text-ink-600">{faNum.format(selected.length)} مورد انتخاب شد</span>
                <button type="button" onClick={() => setSelected([])} className="text-[0.6875rem] text-ink-400 underline underline-offset-4 hover:text-ink-700">
                  پاک کردن
                </button>
              </>
            ) : (
              <span className="text-[0.75rem] text-ink-400">{multiple ? 'می‌توانید چند تصویر انتخاب کنید.' : 'یک تصویر انتخاب کنید.'}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={adminBtn('ghost')}>
              انصراف
            </button>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => {
                onSelect(selected);
                onClose();
              }}
              className={adminBtn('primary')}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ───────────────────────── single image form field ───────────────────────── */

export interface MediaPreview {
  id: number;
  url: string;
  alt?: string;
}

export function MediaField({
  name,
  label,
  hint,
  defaultValue,
  onChange,
}: {
  name: string;
  label?: string;
  hint?: string;
  defaultValue?: MediaPreview | null;
  onChange?: (m: MediaPreview | null) => void;
}) {
  const [value, setValue] = React.useState<MediaPreview | null>(defaultValue ?? null);
  const [open, setOpen] = React.useState(false);
  const set = (m: MediaPreview | null) => {
    setValue(m);
    onChange?.(m);
  };
  return (
    <div>
      {label && <span className="mb-1.5 block text-[0.75rem] font-medium text-ink-700">{label}</span>}
      <input type="hidden" name={name} value={value?.id ?? ''} />
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-cream-100 text-ink-300 hover:border-sage-400"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt={value.alt ?? ''} className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6" strokeWidth={1.5} />
          )}
        </button>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setOpen(true)} className={adminBtn('outline', 'sm')}>
            {value ? 'تعویض تصویر' : 'انتخاب از رسانه'}
          </button>
          {value && (
            <button type="button" onClick={() => set(null)} className={adminBtn('ghost', 'sm')}>
              حذف
            </button>
          )}
        </div>
      </div>
      {hint && <span className="mt-1 block text-[0.6875rem] text-ink-300">{hint}</span>}
      <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={(items) => items[0] && set({ id: items[0].id, url: items[0].url, alt: items[0].alt })} />
    </div>
  );
}
