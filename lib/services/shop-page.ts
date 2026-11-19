import 'server-only';
import { parseQuery, filterProducts, sortProducts, activeFilterCount } from '@/lib/shop';
import { getActiveProducts, getFilterOptions, priceBounds, productsInCategories } from '@/lib/services/catalog';
import { toCardData } from '@/lib/card';
import type { ShopFacets } from '@/components/shop/facets';

type RawParams = Record<string, string | string[] | undefined>;

/** shared loader for /shop and /shop/[category] */
export async function loadShop(params: RawParams, category?: { slug: string; ids: number[] }) {
  const [options, bounds] = await Promise.all([getFilterOptions(), priceBounds()]);
  const query = parseQuery(params, {
    category: category?.slug,
    bounds,
    colorKeys: options.colors.map((c) => c.key),
    sizeKeys: options.sizes.map((s) => s.key),
  });
  const source = category ? await productsInCategories(category.ids) : await getActiveProducts();
  const results = sortProducts(filterProducts(query, source), query.sort);
  const facets: ShopFacets = { colors: options.colors, sizes: options.sizes, bounds };
  return { query, results, products: results.map(toCardData), facets, activeCount: activeFilterCount(query) };
}
