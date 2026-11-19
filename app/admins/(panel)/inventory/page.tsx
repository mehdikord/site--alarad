import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { getSettings } from '@/lib/settings';
import { categoryTreeOptions, descendantsOf, pathLabel } from '@/lib/admin/catalog/categories';
import { AdminPageHeader, KpiCard } from '@/components/admin/ui';
import { FilterTabs, Pagination, SearchBar, fa, paging } from '@/components/admin/table';
import { InventoryTable } from '@/components/admin/catalog/inventory-table';
import { saveStock } from './actions';

export const metadata: Metadata = { title: 'موجودی انبار' };

type SP = { q?: string; filter?: string; category?: string; page?: string };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const settings = await getSettings();
  const low = settings.lowStockThreshold;
  const options = await categoryTreeOptions();
  const q = (sp.q ?? '').trim();
  const filter = sp.filter === 'low' || sp.filter === 'out' ? sp.filter : 'all';
  const categoryId = options.some((o) => o.id === Number(sp.category)) ? Number(sp.category) : null;
  const { page, skip, take } = paging(sp.page, 50);

  const conds: Prisma.ProductVariantWhereInput[] = [];
  if (q) conds.push({ OR: [{ sku: { contains: q } }, { product: { name: { contains: q } } }] });
  if (categoryId) conds.push({ product: { categoryId: { in: descendantsOf(options, categoryId).map(BigInt) } } });
  const base: Prisma.ProductVariantWhereInput = { AND: conds };
  const lowWhere: Prisma.ProductVariantWhereInput = { isActive: true, stock: { gt: 0, lte: low } };
  const outWhere: Prisma.ProductVariantWhereInput = { isActive: true, stock: 0 };
  const where: Prisma.ProductVariantWhereInput = {
    AND: [base, filter === 'low' ? lowWhere : filter === 'out' ? outWhere : {}],
  };

  const [rows, total, allCount, lowCount, outCount, units] = await Promise.all([
    db.productVariant.findMany({
      where,
      orderBy: filter === 'all' ? [{ productId: 'desc' }, { id: 'asc' }] : [{ stock: 'asc' }, { id: 'asc' }],
      skip,
      take,
      include: {
        color: true,
        size: true,
        product: { select: { id: true, name: true, categoryId: true, images: { take: 1, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], include: { media: true } } } },
      },
    }),
    db.productVariant.count({ where }),
    db.productVariant.count({ where: base }),
    db.productVariant.count({ where: { AND: [base, lowWhere] } }),
    db.productVariant.count({ where: { AND: [base, outWhere] } }),
    db.productVariant.aggregate({ where: { AND: [base, { isActive: true }] }, _sum: { stock: true } }),
  ]);

  const href = (f?: string) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (categoryId) u.set('category', String(categoryId));
    if (f) u.set('filter', f);
    const s = u.toString();
    return `/admins/inventory${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <AdminPageHeader title="موجودی انبار" description={`ویرایش سریع موجودی هر تنوع؛ آستانهٔ کم‌موجودی: ${fa(low)} عدد (قابل تغییر در تنظیمات).`} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="تنوع‌ها" value={fa(allCount)} />
        <KpiCard label="کل موجودی" value={`${fa(units._sum.stock ?? 0)} عدد`} delay={0.05} />
        <KpiCard label="کم‌موجود" value={fa(lowCount)} delay={0.1} />
        <KpiCard label="ناموجود" value={fa(outCount)} delay={0.15} />
      </div>
      <FilterTabs
        active={filter}
        items={[
          { value: 'all', label: 'همه', count: allCount, href: href() },
          { value: 'low', label: 'کم‌موجود', count: lowCount, href: href('low') },
          { value: 'out', label: 'ناموجود', count: outCount, href: href('out') },
        ]}
      />
      <SearchBar action="/admins/inventory" defaultValue={q} placeholder="نام محصول یا SKU…" hidden={{ filter: filter === 'all' ? undefined : filter }}>
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
      <InventoryTable
        lowThreshold={low}
        save={saveStock}
        rows={rows.map((v) => ({
          id: Number(v.id),
          productId: Number(v.product.id),
          productName: v.product.name,
          image: v.product.images[0]?.media.url ?? null,
          category: pathLabel(options, Number(v.product.categoryId)),
          colorName: v.color?.name ?? null,
          colorSwatch: v.color ? v.color.swatch || v.color.hex : null,
          sizeLabel: v.size?.label ?? null,
          sku: v.sku,
          stock: v.stock,
          isActive: v.isActive,
        }))}
      />
      <Pagination page={page} pages={Math.ceil(total / take)} total={total} basePath="/admins/inventory" params={{ q: sp.q, filter: sp.filter, category: sp.category }} />
    </>
  );
}
