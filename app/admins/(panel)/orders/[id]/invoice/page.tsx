import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, toId } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { PrintButton } from '@/components/admin/sales/print-button';
import { adminBtn } from '@/components/admin/styles';
import { fa } from '@/components/admin/table';
import { money, toman } from '@/lib/format';
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from '@/lib/order-meta';
import { fDateTime } from '@/lib/admin/sales/shared';

export const metadata: Metadata = { title: 'فاکتور سفارش' };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const orderId = toId((await params).id);
  if (!orderId) notFound();
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { id: 'asc' } }, province: true, city: true, payments: { where: { status: 'paid' }, take: 1 } },
    }),
    getSettings(),
  ]);
  if (!order) notFound();
  const paid = order.payments[0];

  return (
    <>
      {/* print only the invoice sheet, not the admin shell */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #invoice, #invoice * { visibility: visible !important; }
        #invoice { position: absolute; inset: 0; margin: 0; box-shadow: none !important; border: 0 !important; }
        @page { size: A4; margin: 12mm; }
      }`}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/admins/orders/${order.id}`} className={adminBtn('ghost')}>بازگشت به سفارش</Link>
        <PrintButton />
      </div>

      <article id="invoice" className="mx-auto max-w-3xl rounded-xl border border-line-soft bg-white p-6 text-[0.8125rem] text-ink-800 shadow-soft sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[1.25rem] font-semibold text-ink-900">{settings.storeName}</p>
            <p className="mt-1 text-[0.75rem] text-ink-500">{settings.storeAddress}</p>
            <p className="text-[0.75rem] text-ink-500" dir="ltr">{settings.storePhone}</p>
          </div>
          <div className="text-end">
            <p className="text-[1rem] font-semibold text-ink-900">فاکتور فروش</p>
            <p className="mt-1 font-mono text-[0.8125rem]" dir="ltr">{order.code}</p>
            <p className="text-[0.75rem] text-ink-500">{fDateTime(order.createdAt)}</p>
          </div>
        </header>

        <section className="grid gap-4 border-b border-line py-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[0.6875rem] text-ink-400">گیرنده</p>
            <p className="font-medium text-ink-900">{order.receiverName}</p>
            <p dir="ltr" className="text-end sm:text-start">{order.receiverPhone}</p>
          </div>
          <div>
            <p className="mb-1 text-[0.6875rem] text-ink-400">نشانی</p>
            <p className="leading-7">
              {order.province.name}، {order.city.name}، {order.address}
              {order.unit ? `، ${order.unit}` : ''} — کد پستی <span dir="ltr">{order.postalCode}</span>
            </p>
          </div>
        </section>

        <table className="mt-4 w-full text-[0.75rem]">
          <thead>
            <tr className="border-b border-line text-ink-500">
              <th className="py-2 text-start font-medium">#</th>
              <th className="py-2 text-start font-medium">شرح کالا</th>
              <th className="py-2 text-start font-medium">کد کالا</th>
              <th className="py-2 text-center font-medium">تعداد</th>
              <th className="py-2 text-end font-medium">فی (تومان)</th>
              <th className="py-2 text-end font-medium">جمع (تومان)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={String(it.id)} className="border-b border-line-soft">
                <td className="py-2">{fa(i + 1)}</td>
                <td className="py-2">
                  {it.productName}
                  <span className="text-ink-400">{[it.colorName, it.sizeLabel && `سایز ${it.sizeLabel}`].filter(Boolean).map((x) => ` · ${x}`).join('')}</span>
                </td>
                <td className="py-2 font-mono" dir="ltr">{it.sku ?? '—'}</td>
                <td className="py-2 text-center">{fa(it.quantity)}</td>
                <td className="py-2 text-end">{money(it.unitPrice)}</td>
                <td className="py-2 text-end">{money(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="text-[0.75rem] text-ink-500">
            <p>روش پرداخت: {PAYMENT_METHOD_LABEL[order.paymentMethod]} — {PAYMENT_STATUS[order.paymentStatus].label}</p>
            {paid?.refId && <p>کد پیگیری بانکی: <span dir="ltr">{paid.refId}</span></p>}
            <p>روش ارسال: {order.shippingTitle ?? '—'}</p>
          </div>
          <dl className="w-full max-w-xs space-y-1.5">
            <Line label="جمع کالاها" value={toman(order.subtotal)} />
            {order.discount > 0 && <Line label={`تخفیف${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`− ${toman(order.discount)}`} />}
            <Line label="هزینهٔ ارسال" value={order.shippingCost ? toman(order.shippingCost) : 'رایگان'} />
            <Line label="مالیات بر ارزش افزوده" value={toman(order.tax)} />
            <div className="flex justify-between border-t border-line pt-2 text-[0.875rem] font-semibold text-ink-900">
              <span>مبلغ کل</span>
              <span>{toman(order.total)}</span>
            </div>
          </dl>
        </div>

        <p className="mt-8 text-center text-[0.6875rem] text-ink-400">از خرید شما سپاسگزاریم — {settings.storeName}</p>
      </article>
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-600">
      <span>{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  );
}
