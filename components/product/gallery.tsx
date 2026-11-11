'use client';

import * as React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GalleryImage {
  src: string;
  blur: string;
  key: string;
}

export function Gallery({ images, alt }: { images: GalleryImage[]; alt: string }) {
  const [index, setIndex] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);
    const touchX = React.useRef<number | null>(null);

  React.useEffect(() => setIndex(0), [images[0]?.src]);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + images.length) % images.length);

  const onTouchStart = (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 48) go(dx > 0 ? -1 : 1); // RTL: swipe right → previous
    touchX.current = null;
  };

  const current = images[index];

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-cream-200 shadow-soft">
        <div
          className="relative aspect-[4/5] w-full touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={current.key}
              initial={{opacity: 0, scale: 1.02}}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={current.src}
                alt={`${alt} — تصویر ${index + 1}`}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 46vw"
                placeholder="blur"
                blurDataURL={current.blur}
                quality={88}
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setZoom(true)}
            aria-label="بزرگ‌نمایی تصویر"
            className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-full bg-cream-50/90 text-ink-700 shadow-soft backdrop-blur-md transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <Expand className="size-4" strokeWidth={1.7} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="تصویر قبلی"
                className="absolute end-2.5 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream-50/85 text-ink-700 opacity-0 shadow-soft backdrop-blur-md transition-opacity duration-300 hover:opacity-100 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronRight className="size-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="تصویر بعدی"
                className="absolute start-2.5 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream-50/85 text-ink-700 opacity-0 shadow-soft backdrop-blur-md transition-opacity duration-300 hover:opacity-100 sm:flex"
              >
                <ChevronLeft className="size-4" strokeWidth={2} />
              </button>
            </>
          )}

          {/* mobile dots */}
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
              {images.map((img, i) => (
                <button
                  key={img.key}
                  onClick={() => setIndex(i)}
                  aria-label={`تصویر ${i + 1}`}
                  className={cn(
                    'h-1 rounded-full transition-all duration-400 ease-silk',
                    i === index ? 'w-5 bg-ink-900/70' : 'w-1.5 bg-cream-50/80',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* thumbnails */}
      {images.length > 1 && (
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={img.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`تصویر ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'relative aspect-[4/5] overflow-hidden rounded-md border transition-all duration-300 ease-silk',
                i === index ? 'border-sage-500 ring-1 ring-sage-400/40' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <Image src={img.src} alt="" fill sizes="90px" placeholder="blur" blurDataURL={img.blur} className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* fullscreen zoom */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex flex-col bg-ink-900/92 backdrop-blur-sm"
            onClick={() => setZoom(false)}
            role="dialog"
            aria-modal="true"
            aria-label="نمایش تمام‌صفحه"
          >
            <div className="flex items-center justify-between px-4 py-3 text-cream-50">
              <span className="text-[0.75rem]">
                {index + 1} / {images.length}
              </span>
              <button onClick={() => setZoom(false)} aria-label="بستن" className="flex size-9 items-center justify-center rounded-full bg-white/10">
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>
            <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
              <Image src={current.src} alt={`${alt} — بزرگ`} fill sizes="100vw" className="object-contain" quality={92} />
            </div>
            <div className="flex justify-center gap-3 p-4">
              <button onClick={() => go(-1)} aria-label="قبلی" className="flex size-10 items-center justify-center rounded-full bg-white/10 text-cream-50">
                <ChevronRight className="size-5" />
              </button>
              <button onClick={() => go(1)} aria-label="بعدی" className="flex size-10 items-center justify-center rounded-full bg-white/10 text-cream-50">
                <ChevronLeft className="size-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
