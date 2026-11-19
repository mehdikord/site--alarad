import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export const addressInclude = { province: true, city: true } satisfies Prisma.AddressInclude;

export const toAddressDTO = (a: Prisma.AddressGetPayload<{ include: typeof addressInclude }>) => ({
  id: Number(a.id),
  title: a.title ?? '',
  receiverName: a.receiverName,
  receiverPhone: a.receiverPhone,
  provinceId: Number(a.provinceId),
  provinceName: a.province.name,
  cityId: Number(a.cityId),
  cityName: a.city.name,
  postalCode: a.postalCode,
  address: a.address,
  unit: a.unit ?? '',
  isDefault: a.isDefault,
});

export type AddressDTO = ReturnType<typeof toAddressDTO>;

export async function addressesOf(userId: bigint) {
  const rows = await db.address.findMany({ where: { userId }, include: addressInclude, orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] });
  return rows.map(toAddressDTO);
}
