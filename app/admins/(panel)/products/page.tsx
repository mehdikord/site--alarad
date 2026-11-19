import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { Pencil, Plus, ExternalLink } from 'lucide-react';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { getSettings } from '@/lib/settings';
import { categoryTreeOptions, descendantsOf, pathLabel } from '@/lib/admin/catalog/categories';
import { STATUS_LABEL, type ProductStatusKey } from '@/lib/admin/catalog/product-types';
import { AdminPageHeader, StockPill } from '@/components/admin/ui';
import { Badge, EmptyRow, FilterTabs, Pagination, SearchBar, Table, Td, Th, THead, Tr, fa, paging } from '@/components/admin/table';
import { adminBtn } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'محصولات' };

type SP = { q?: string; category?: string; status?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const settings = await getSettings();
  const options = await categoryTreeOptions();
  const q = (sp.q ?? '').trim();
  const status = (['draft', 'active', 'archived'] as const).includes(sp.status as ProductStatusKey) ? (sp.status as ProductStatusKey) : undefined;
  const categoryId = options.some((o) => o.id === Number(sp.category)) ? Number(sp.category) : null;
  const { page, skip, take } = paging(sp.page, 20);

  const base: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }, { variants: { some: { sku: { contains: q } } } }] } : {}),
    ...(categoryId ? { categoryId: { in: descendantsOf(options, categoryId).map(BigInt) } } : {}),
  };
  const where: Prisma.ProductWhereInput = { ...base, ...(status ? { status } : {}) };

  const [rows, total, counts] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take,
      include: {
        images: { take: 1, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], include: { media: true } },
        variants: { select: { stock: true, isActive: true } },
      },
    }),
    db.product.count({ where }),
    db.product.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
  ]);
  const countOf = (s?: ProductStatusKey) => (s ? counts.find((c) => c.status === s)?._count._all ?? 0 : counts.reduce((a, c) => a + c._count._all, 0));
  const params = { q: sp.q, category: sp.category, status: sp.status };
  const tabHref = (s?: string) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (categoryId) u.set('category', String(categoryId));
    if (s) u.set('status', s);
    const qs = u.toString();
    return `/admins/products${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <AdminPageHeader
        title="محصولات"
        description="مدیریت کاتالوگ، قیمت، تنوع‌ها (رنگ × سایز) و تصاویر"
        action={
          <Link href="/admins/products/new" className={adminBtn('primary')}>
            <Plus className="size-4" />
            محصول جدید
          </Link>
        }
      />
      <FilterTabs
        active={status ?? 'all'}
        items={[
          { value: 'all', label: 'همه', count: countOf(), href: tabHref() },
          ...(['active', 'draft', 'archived'] as const).map((s) => ({ value: s, label: STATUS_LABEL[s].label, count: countOf(s), href: tabHref(s) })),
        ]}
      />
      <SearchBar action="/admins/products" defaultValue={q} placeholder="نام، نامک یا SKU…" hidden={{ status }}>
        <select name="category" defaultValue={categoryId ?? ''} className="h-10 rounded-lg border border-line bg-white px-3 text-[0.8125rem] outline-none focus:border-sage-400">
          <option value="">همهٔ دسته‌ها</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {'  '.repeat(o.depth * 2)}
              {o.depth ? '└ ' : ''}
              {o.name}
            </option>
          ))}
        </select>
      </SearchBar>

      <Table>
        <THead>
          <Th>محصول</Th>
          <Th>دسته</Th>
          <Th>قیمت (تومان)</Th>
          <Th>موجودی</Th>
          <Th className="text-center">تنوع</Th>
          <Th>وضعیت</Th>
          <Th className="text-end">عملیات</Th>
        </THead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={7}>محصولی با این شرایط پیدا نشد.</EmptyRow>}
          {rows.map((p) => {
            const active = p.variants.filter((v) => v.isActive);
            const stock = active.reduce((s, v) => s + v.stock, 0);
            const low = active.filter((v) => v.stock <= settings.lowStockThreshold).length;
            const img = p.images[0]?.media.url;
            return (
              <Tr key={p.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="size-11 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="size-11 shrink-0 rounded-md bg-cream-200" />
                    )}
                    <div className="min-w-0">
                      <Link href={`/admins/products/${p.id}`} className="line-clamp-1 font-medium text-ink-900 hover:text-sage-700">
                        {p.name}
                      </Link>
                      <p className="font-mono text-[0.625rem] text-ink-300" dir="ltr">{p.slug}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-[0.75rem] text-ink-500">{pathLabel(options, Number(p.categoryId))}</Td>
                <Td>
                  <span className="text-ink-900">{fa(p.price)}</span>
                  {p.compareAtPrice && p.compareAtPrice > p.price && <span className="block text-[0.625rem] text-ink-300 line-through">{fa(p.compareAtPrice)}</span>}
                </Td>
                <Td>
                  <StockPill stock={stock} />
                  {low > 0 && <span className="block pt-0.5 text-[0.625rem] text-blush-500">{fa(low)} تنوع کم‌موجود</span>}
                </Td>
                <Td className="text-center">{fa(active.length)}</Td>
                <Td>
                  <Badge tone={STATUS_LABEL[p.status].tone}>{STATUS_LABEL[p.status].label}</Badge>
                  {p.isFeatured && <Badge tone="bg-blush-100 text-blush-500" className="ms-1">ویژه</Badge>}
                </Td>
                <Td className="text-end">
                  <div className="flex justify-end gap-1">
                    {p.status === 'active' && (
                      <Link href={`/product/${p.slug}`} target="_blank" className={adminBtn('ghost', 'sm')} aria-label="مشاهده در فروشگاه">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    )}
                    <Link href={`/admins/products/${p.id}`} className={adminBtn('outline', 'sm')}>
                      <Pencil className="size-3.5" />
                      ویرایش
                    </Link>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
      <Pagination page={page} pages={Math.ceil(total / take)} total={total} basePath="/admins/products" params={params} />
    </>
  );
}
