'use client';

import * as React from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminBtn, adminInput } from '@/components/admin/form';
import { Dropzone, MediaDetails, MediaTile, useMediaLibrary, useMediaUpload } from '@/components/admin/catalog/media-picker';
import type { MediaDTO } from '@/lib/media';

const faNum = new Intl.NumberFormat('fa-IR');

export function MediaLibrary() {
  const lib = useMediaLibrary(48);
  const { upload, progress, uploading } = useMediaUpload();
  const [focused, setFocused] = React.useState<MediaDTO | null>(null);

  const onFiles = async (files: FileList) => {
    const created = await upload(files);
    if (!created.length) return;
    lib.setItems((prev) => [...created, ...prev]);
    lib.setTotal((t) => t + created.length);
    setFocused(created[0]);
  };

  const details = focused && (
    <MediaDetails
      m={focused}
      allowDelete
      onSaved={(m) => {
        setFocused(m);
        lib.setItems((prev) => prev.map((p) => (p.id === m.id ? m : p)));
      }}
      onDeleted={(id) => {
        setFocused(null);
        lib.setItems((prev) => prev.filter((p) => p.id !== id));
        lib.setTotal((t) => Math.max(0, t - 1));
      }}
    />
  );

  return (
    <div className="space-y-4">
      <Dropzone onFiles={onFiles} uploading={uploading} progress={progress} compact />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" />
          <input value={lib.q} onChange={(e) => lib.setQ(e.target.value)} placeholder="جست‌وجو در رسانه…" className={cn(adminInput, 'ps-8')} />
        </div>
        <span className="text-[0.75rem] text-ink-400">{faNum.format(lib.total)} فایل</span>
        {lib.loading && <Loader2 className="size-4 animate-spin text-ink-300" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-line-soft bg-white p-3 sm:p-4">
          {lib.items.length === 0 && !lib.loading ? (
            <p className="py-16 text-center text-[0.8125rem] text-ink-400">{lib.q ? 'فایلی پیدا نشد.' : 'کتابخانهٔ رسانه خالی است.'}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 xl:grid-cols-6">
              {lib.items.map((m) => (
                <MediaTile key={m.id} m={m} focused={focused?.id === m.id} selected={focused?.id === m.id} onClick={() => setFocused(m)} />
              ))}
            </div>
          )}
          {lib.page < lib.pages && (
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={lib.loadMore} disabled={lib.loading} className={adminBtn('outline', 'sm')}>
                نمایش بیشتر
              </button>
            </div>
          )}
        </div>

        {/* desktop side panel */}
        <aside className="hidden rounded-xl border border-line-soft bg-white p-4 lg:block lg:self-start lg:sticky lg:top-6">
          {details ?? <p className="py-10 text-center text-[0.75rem] text-ink-400">یک فایل را برای ویرایش انتخاب کنید.</p>}
        </aside>
      </div>

      {/* mobile drawer */}
      {focused && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-ink-900/30" onClick={() => setFocused(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-float">
            <button type="button" onClick={() => setFocused(null)} aria-label="بستن" className="mb-2 ms-auto flex size-8 items-center justify-center rounded-full text-ink-400 hover:bg-cream-200">
              <X className="size-4" />
            </button>
            {details}
          </div>
        </div>
      )}
    </div>
  );
}
