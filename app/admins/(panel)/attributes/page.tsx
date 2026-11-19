import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { FilterTabs } from '@/components/admin/table';
import { ColorRow, SizeRow, TagRow } from '@/components/admin/catalog/attribute-forms';
import { deleteColor, deleteSize, deleteTag, saveColor, saveSize, saveTag } from './actions';

export const metadata: Metadata = { title: 'رنگ، سایز و برچسب' };

type Tab = 'colors' | 'sizes' | 'tags';

export default async function AttributesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const raw = (await searchParams).tab;
  const tab: Tab = raw === 'sizes' || raw === 'tags' ? raw : 'colors';
  const [colors, sizes, tags] = await Promise.all([
    db.color.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], include: { _count: { select: { variants: true } } } }),
    db.size.findMany({ orderBy: [{ sizeGroup: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }], include: { _count: { select: { variants: true } } } }),
    db.tag.findMany({ orderBy: { id: 'asc' }, include: { _count: { select: { products: true } } } }),
  ]);
  const groups = [...new Set(sizes.map((s) => s.sizeGroup))];

  return (
    <>
      <AdminPageHeader title="رنگ، سایز و برچسب" description="ویژگی‌هایی که در ساخت تنوع‌های محصول (رنگ × سایز) و فیلترهای فروشگاه استفاده می‌شوند." />
      <FilterTabs
        active={tab}
        items={[
          { value: 'colors', label: 'رنگ‌ها', count: colors.length, href: '/admins/attributes' },
          { value: 'sizes', label: 'سایزها', count: sizes.length, href: '/admins/attributes?tab=sizes' },
          { value: 'tags', label: 'برچسب‌ها', count: tags.length, href: '/admins/attributes?tab=tags' },
        ]}
      />

      {tab === 'colors' && (
        <div className="space-y-4">
          <Panel title="افزودن رنگ" description="کلید لاتین در نشانی فیلترها استفاده می‌شود؛ swatch (گرادیان) اختیاری است.">
            <div className="-m-4">
              <ColorRow save={saveColor} remove={deleteColor} />
            </div>
          </Panel>
          <Panel title="رنگ‌ها">
            <div className="-m-4">
              {colors.map((c) => (
                <ColorRow
                  key={c.id}
                  save={saveColor}
                  remove={deleteColor}
                  value={{ id: Number(c.id), key: c.key, name: c.name, hex: c.hex, swatch: c.swatch ?? '', sortOrder: c.sortOrder, usage: c._count.variants }}
                />
              ))}
              {colors.length === 0 && <p className="p-6 text-center text-[0.8125rem] text-ink-400">رنگی تعریف نشده است.</p>}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'sizes' && (
        <div className="space-y-4">
          <Panel title="افزودن سایز" description="سایزها در گروه‌ها (مثل sock، tights، briefs) دسته‌بندی می‌شوند؛ هر محصول از یک گروه سایز استفاده می‌کند.">
            <div className="-m-4">
              <SizeRow save={saveSize} remove={deleteSize} defaultGroup={groups[0]} />
            </div>
          </Panel>
          {groups.map((g) => (
            <Panel key={g} title={`گروه ${g}`} description={`${new Intl.NumberFormat('fa-IR').format(sizes.filter((s) => s.sizeGroup === g).length)} سایز`}>
              <div className="-m-4">
                {sizes
                  .filter((s) => s.sizeGroup === g)
                  .map((s) => (
                    <SizeRow
                      key={s.id}
                      save={saveSize}
                      remove={deleteSize}
                      value={{ id: Number(s.id), sizeGroup: s.sizeGroup, key: s.key, label: s.label, note: s.note ?? '', sortOrder: s.sortOrder, usage: s._count.variants }}
                    />
                  ))}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'tags' && (
        <div className="space-y-4">
          <Panel title="افزودن برچسب" description="برچسب‌ها برای فیلترهای ویژهٔ فروشگاه (تازه‌ها، پرفروش‌ها، هدیه…) استفاده می‌شوند.">
            <div className="-m-4">
              <TagRow save={saveTag} remove={deleteTag} />
            </div>
          </Panel>
          <Panel title="برچسب‌ها">
            <div className="-m-4">
              {tags.map((t) => (
                <TagRow key={t.id} save={saveTag} remove={deleteTag} value={{ id: Number(t.id), name: t.name, slug: t.slug, usage: t._count.products }} />
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
