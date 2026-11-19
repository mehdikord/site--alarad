import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { Media } from '@prisma/client';
import { db } from '@/lib/db';

export const UPLOAD_ROOT = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'storage/uploads');
export const MAX_UPLOAD_BYTES = Number(process.env.UPLOAD_MAX_MB ?? 8) * 1024 * 1024;

export const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export interface MediaDTO {
  id: number;
  url: string;
  blur: string | null;
  alt: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  usage?: number;
}

export const toMediaDTO = (m: Media & { _count?: { productImages: number; categories: number } }): MediaDTO => ({
  id: Number(m.id),
  url: m.url,
  blur: m.blurDataUrl,
  alt: m.alt ?? '',
  title: m.title ?? '',
  originalName: m.originalName,
  mimeType: m.mimeType,
  size: m.size,
  width: m.width,
  height: m.height,
  createdAt: m.createdAt.toISOString(),
  usage: m._count ? m._count.productImages + m._count.categories : undefined,
});

/** Stores an uploaded image under storage/uploads/YYYY/MM and registers it in the media library. */
export async function saveUpload(file: File, adminId: bigint | null) {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) throw new Error('فقط تصاویر JPG، PNG، WEBP، GIF و AVIF مجاز هستند.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`حجم فایل نباید بیشتر از ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} مگابایت باشد.`);

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer, { animated: file.type === 'image/gif' });
  const meta = await image.metadata().catch(() => null);
  if (!meta?.width) throw new Error('فایل تصویر معتبر نیست.');

  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fileName = `${randomUUID()}.${ext}`;
  const rel = `${dir}/${fileName}`;
  await fs.mkdir(path.join(UPLOAD_ROOT, dir), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_ROOT, rel), buffer);

  const blur = await sharp(buffer)
    .resize(16, 16, { fit: 'inside' })
    .webp({ quality: 40 })
    .toBuffer()
    .then((b) => `data:image/webp;base64,${b.toString('base64')}`)
    .catch(() => null);

  const base = file.name.replace(/\.[^.]+$/, '').slice(0, 200);
  return db.media.create({
    data: {
      adminId,
      disk: 'uploads',
      path: rel,
      url: `/uploads/${rel}`,
      fileName,
      originalName: file.name.slice(0, 255) || fileName,
      mimeType: file.type,
      size: file.size,
      width: meta.width ?? null,
      height: meta.pageHeight ?? meta.height ?? null,
      blurDataUrl: blur,
      alt: base,
      title: base,
    },
  });
}

/** Deletes the DB row and (for uploaded files) the file on disk. */
export async function deleteMedia(id: bigint) {
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return;
  await db.media.delete({ where: { id } });
  if (media.disk === 'uploads') {
    const full = path.resolve(UPLOAD_ROOT, media.path);
    if (full.startsWith(UPLOAD_ROOT + path.sep)) await fs.unlink(full).catch(() => null);
  }
}
