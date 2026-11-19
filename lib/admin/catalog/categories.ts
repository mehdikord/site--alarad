import 'server-only';
import { db } from '@/lib/db';

export interface CategoryOption {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  depth: number;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  childCount: number;
  image: string | null;
}

/** every category, depth-first ordered (parent → children) with depth for indented selects */
export async function categoryTreeOptions(): Promise<CategoryOption[]> {
  const rows = await db.category.findMany({
    include: { image: true, _count: { select: { products: true, children: true } } },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  const out: CategoryOption[] = [];
  const seen = new Set<bigint>();
  const walk = (parentId: bigint | null, depth: number) => {
    for (const r of rows.filter((x) => x.parentId === parentId)) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push({
        id: Number(r.id),
        parentId: r.parentId === null ? null : Number(r.parentId),
        name: r.name,
        slug: r.slug,
        depth,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        productCount: r._count.products,
        childCount: r._count.children,
        image: r.image?.url ?? null,
      });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  // orphans (shouldn't happen) appended at root
  for (const r of rows) if (!seen.has(r.id)) out.push({ id: Number(r.id), parentId: null, name: r.name, slug: r.slug, depth: 0, isActive: r.isActive, sortOrder: r.sortOrder, productCount: r._count.products, childCount: r._count.children, image: r.image?.url ?? null });
  return out;
}

/** ids of a category and all of its descendants */
export function descendantsOf(options: { id: number; parentId: number | null }[], id: number): number[] {
  const res: number[] = [id];
  for (let i = 0; i < res.length; i++) for (const o of options) if (o.parentId === res[i] && !res.includes(o.id)) res.push(o.id);
  return res;
}

/** "جوراب › ساق کوتاه" path label */
export function pathLabel(options: CategoryOption[], id: number) {
  const byId = new Map(options.map((o) => [o.id, o]));
  const parts: string[] = [];
  let cur = byId.get(id);
  let guard = 0;
  while (cur && guard++ < 20) {
    parts.unshift(cur.name);
    cur = cur.parentId === null ? undefined : byId.get(cur.parentId);
  }
  return parts.join(' › ');
}
