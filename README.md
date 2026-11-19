# الاردشاپ — فروشگاه آنلاین + پنل مدیریت

Next.js 15 · Prisma 6 · MySQL 8 · Tailwind v4

## راه‌اندازی

```bash
npm install                 # prisma generate هم خودکار اجرا می‌شود
npm run db:migrate          # اجرای migration ها (prisma/migrations)
npm run db:seed             # اجرای همهٔ seeder ها
npm run dev
```

اطلاعات اتصال دیتابیس در `.env` است (نمونه: `.env.example`).

| دستور | کار |
|---|---|
| `npm run db:migrate` | اجرای migration های اعمال‌نشده (`prisma migrate deploy`) |
| `npm run db:seed` | اجرای همهٔ seeder ها — `npm run db:seed -- --only=admin,geo` برای اجرای انتخابی |
| `npm run db:fresh` | حذف کامل جداول + migrate + seed (مثل `migrate:fresh --seed` لاراول) |
| `npm run db:status` | وضعیت migration ها |
| `npm run db:studio` | مشاهدهٔ دیتابیس در Prisma Studio |

## دیتابیس

- اسکیما: `prisma/schema.prisma` — ۲۸ جدول با قواعد لاراول: نام جدول snake_case جمع، همهٔ `id` ها و کلیدهای خارجی `BIGINT UNSIGNED`، همهٔ جداول `created_at` / `updated_at`، نام ایندکس‌ها `*_unique` / `*_index` / `*_foreign`. مبالغ به تومان (`INT UNSIGNED`).
- migration ها: `prisma/migrations/2026_11_19_0000NN_create_<table>_table` — یک migration برای هر جدول، به ترتیب وابستگی.
- seeder ها: `prisma/seeders/*` و `prisma/seed.ts`
  - `admin` — مدیر پیش‌فرض: **09120000000 / admin1234**
  - `geo` — استان‌ها و شهرها از `data/provinces.sql` و `data/cities.sql` (۳۲ استان، ۴۲۷ شهر، با همان id ها)
  - `settings`، `shipping`، `coupons`، `catalog` (رنگ، سایز، برچسب، دسته‌بندی تو در تو، رسانه، ۳۸ محصول، ۳۵۲ تنوع، نظرها)

## پنل مدیریت — `/admins`

ورود با شمارهٔ موبایل + رمز عبور. بخش‌ها: داشبورد، سفارش‌ها (تغییر وضعیت، ثبت مرسوله و کد رهگیری، فاکتور چاپی)، ارسال مرسوله‌ها، تراکنش‌های پرداخت، محصولات (تنوع رنگ×سایز، گالری از رسانه)، دسته‌بندی تو در تو، رنگ/سایز/برچسب، موجودی انبار، رسانه (کتابخانه + آپلود، پنجرهٔ انتخاب مثل وردپرس)، کاربران، نظرها، کد تخفیف، خبرنامه، روش‌های ارسال (محدودیت استانی)، استان‌ها و شهرها، مدیران سیستم، تنظیمات.

فایل‌های آپلودی در `storage/uploads` ذخیره و از مسیر `/uploads/...` سرو می‌شوند.

## پرداخت و ورود مشتری

- `PAYMENT_DRIVER=mock` درگاه آزمایشی محلی (`/payment/mock/...`) — برای اتصال واقعی `PAYMENT_DRIVER=zarinpal` و `ZARINPAL_MERCHANT_ID` را تنظیم کنید (`ZARINPAL_SANDBOX=false` برای محیط واقعی). `APP_URL` باید آدرس عمومی سایت باشد (callback درگاه).
- ورود مشتری با کد یک‌بارمصرف پیامکی؛ `SMS_DRIVER=log` کد را در کنسول سرور چاپ می‌کند و در حالت توسعه روی صفحه هم نمایش می‌دهد. برای ارسال واقعی، سرویس پیامک را در `lib/sms.ts` اضافه کنید.
- موجودی هنگام ثبت سفارش رزرو می‌شود؛ سفارش‌های پرداخت‌نشده پس از `payment_timeout_minutes` لغو و موجودی برگردانده می‌شود.
