/**
 * DatabaseSeeder — runs every seeder in order.
 *
 *   npm run db:seed                       → all seeders
 *   npm run db:seed -- --only=admin,geo    → selected seeders
 *
 * keys: admin | geo | settings | shipping | coupons | catalog
 */
import { prisma } from './seeders/client';
import { adminSeeder } from './seeders/admin-seeder';
import { provinceCitySeeder } from './seeders/province-city-seeder';
import { settingSeeder } from './seeders/setting-seeder';
import { shippingMethodSeeder } from './seeders/shipping-method-seeder';
import { couponSeeder } from './seeders/coupon-seeder';
import { catalogSeeder } from './seeders/catalog-seeder';

const SEEDERS: [string, () => Promise<void>][] = [
  ['admin', adminSeeder],
  ['geo', provinceCitySeeder],
  ['settings', settingSeeder],
  ['shipping', shippingMethodSeeder], // depends on geo
  ['coupons', couponSeeder],
  ['catalog', catalogSeeder],
];

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;
  for (const [key, run] of SEEDERS) {
    if (only && !only.includes(key)) continue;
    await run();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
