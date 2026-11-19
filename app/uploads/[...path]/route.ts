import fs from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_ROOT } from '@/lib/media';

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

/** Serves files from storage/uploads (works after `next build`, unlike runtime writes to /public). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const full = path.resolve(UPLOAD_ROOT, ...parts);
  if (!full.startsWith(UPLOAD_ROOT + path.sep)) return new Response('Not found', { status: 404 });
  const type = TYPES[path.extname(full).slice(1).toLowerCase()];
  if (!type) return new Response('Not found', { status: 404 });
  try {
    const data = await fs.readFile(full);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': type,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
