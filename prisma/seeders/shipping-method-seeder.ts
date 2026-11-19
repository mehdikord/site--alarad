import { prisma, log } from './client';

// province ids from data/provinces.sql
const TEHRAN = 8n;
const ALBORZ = 5n;
const TEHRAN_COUNTIES = 32n;

export async function shippingMethodSeeder() {
  const methods = [
    {
      code: 'standard',
      title: 'پست پیشتاز',
      description: 'ارسال به تمام نقاط کشور با کد رهگیری',
      cost: 49_000,
      freeShippingThreshold: 500_000,
      eta: '۲ تا ۴ روز کاری',
      supportsCod: false,
      sortOrder: 1,
      provinces: [] as bigint[],
    },
    {
      code: 'express',
      title: 'ارسال سریع تهران',
      description: 'ویژه تهران و کرج، پیک اختصاصی',
      cost: 89_000,
      freeShippingThreshold: 500_000,
      eta: 'همان روز (سفارش تا ساعت ۱۲)',
      supportsCod: true,
      sortOrder: 2,
      provinces: [TEHRAN, ALBORZ, TEHRAN_COUNTIES],
    },
    {
      code: 'pickup',
      title: 'تحویل حضوری',
      description: 'دریافت از بوتیک الاردشاپ — تهران، خیابان ولیعصر',
      cost: 0,
      freeShippingThreshold: null,
      eta: 'آماده‌سازی ۲ ساعته',
      supportsCod: true,
      sortOrder: 3,
      provinces: [TEHRAN, ALBORZ, TEHRAN_COUNTIES],
    },
  ];

  for (const { provinces, ...m } of methods) {
    const row = await prisma.shippingMethod.upsert({ where: { code: m.code }, update: {}, create: m });
    for (const provinceId of provinces) {
      await prisma.shippingMethodProvince.upsert({
        where: { shippingMethodId_provinceId: { shippingMethodId: row.id, provinceId } },
        update: {},
        create: { shippingMethodId: row.id, provinceId },
      });
    }
  }
  log('ShippingMethodSeeder', `${methods.length} shipping methods`);
}
