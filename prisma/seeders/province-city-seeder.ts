import fs from 'node:fs';
import path from 'node:path';
import { Prisma } from '@prisma/client';
import { prisma, log } from './client';

const DATA_DIR = path.join(process.cwd(), 'data');

const unescape = (s: string) => s.replace(/\\(.)/g, '$1');

/** Reads data/provinces.sql + data/cities.sql (original ids are preserved). */
export function readProvinceCityDumps() {
  const provincesSql = fs.readFileSync(path.join(DATA_DIR, 'provinces.sql'), 'utf8');
  const citiesSql = fs.readFileSync(path.join(DATA_DIR, 'cities.sql'), 'utf8');

  const provinces = [...provincesSql.matchAll(/VALUES\s*\(\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)].map((m) => ({
    id: BigInt(m[1]),
    name: unescape(m[2]).trim(),
  }));
  const cities = [...citiesSql.matchAll(/VALUES\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)].map((m) => ({
    id: BigInt(m[1]),
    provinceId: BigInt(m[2]),
    name: unescape(m[3]).trim(),
  }));

  const statements = (sql: string) => sql.split('\n').filter((l) => /^\s*INSERT/i.test(l)).length;
  if (provinces.length !== statements(provincesSql)) throw new Error('provinces.sql: some rows could not be parsed');
  if (cities.length !== statements(citiesSql)) throw new Error('cities.sql: some rows could not be parsed');

  const provinceIds = new Set(provinces.map((p) => p.id));
  const orphan = cities.find((c) => !provinceIds.has(c.provinceId));
  if (orphan) throw new Error(`city ${orphan.id} references unknown province ${orphan.provinceId}`);

  return { provinces, cities };
}

export async function provinceCitySeeder() {
  const { provinces, cities } = readProvinceCityDumps();

  await prisma.$executeRaw`
    INSERT INTO provinces (id, name, created_at, updated_at)
    VALUES ${Prisma.join(provinces.map((p) => Prisma.sql`(${p.id}, ${p.name}, NOW(), NOW())`))}
    AS new ON DUPLICATE KEY UPDATE name = new.name, updated_at = NOW()`;

  for (let i = 0; i < cities.length; i += 200) {
    const chunk = cities.slice(i, i + 200);
    await prisma.$executeRaw`
      INSERT INTO cities (id, province_id, name, created_at, updated_at)
      VALUES ${Prisma.join(chunk.map((c) => Prisma.sql`(${c.id}, ${c.provinceId}, ${c.name}, NOW(), NOW())`))}
      AS new ON DUPLICATE KEY UPDATE province_id = new.province_id, name = new.name, updated_at = NOW()`;
  }

  log('ProvinceCitySeeder', `${provinces.length} provinces, ${cities.length} cities`);
}
