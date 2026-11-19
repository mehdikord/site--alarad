import { getAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return Response.json({ ok: false, message: 'دسترسی غیرمجاز' }, { status: 401 });
  const rows = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  const lines = ['contact,status,subscribed_at', ...rows.map((r) => [cell(r.contact), r.isActive ? 'active' : 'inactive', r.createdAt.toISOString()].join(','))];
  // BOM so Excel opens UTF-8 correctly
  return new Response('﻿' + lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
