import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin, Package, Printer, Truck, User } from 'lucide-react';
import { db, toId } from '@/lib/db';
import { Panel } from '@/components/admin/ui';
import { ActionForm, SelectField, SubmitButton, TextArea, TextField, Toggle } from '@/components/admin/form';
import { adminBtn } from '@/components/admin/styles';
import { Badge, fa } from '@/components/admin/table';
import {
  GATEWAY_LABEL, NEXT_STATUSES, ORDER_STATUS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS, SHIPMENT_STATUS, TRANSACTION_STATUS,
  type ShipmentStatusKey,
} from '@/lib/order-meta';
import { toman } from '@/lib/format';
import { fDateTime } from '@/lib/admin/sales/shared';
import { changeStatusAction, saveAdminNoteAction, saveShipmentAction } from '../actions';

export const metadata: Metadata = { title: 'جزئیات سفارش' };

const SHIP_OPTIONS = (Object.keys(SHIPMENT_STATUS) as ShipmentStatusKey[]).map((s) => ({ value: s, label: SHIPMENT_STATUS[s].label }));

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const orderId = toId((await params).id);
  if (!orderId) notFound();
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { orderBy: { id: 'asc' } },
      province: true,
      city: true,
      user: true,
      shippingMethod: true,
      coupon: true,
      payments: { orderBy: { createdAt: 'desc' } },
      shipments: { orderBy: { createdAt: 'asc' }, include: { admin: { select: { name: true } } } },
      statusHistories: { orderBy: { createdAt: 'asc' }, include: { admin: { select: { name: true } } } },
    },
  });
  if (!order) notFound();

  const next = NEXT_STATUSES[order.status];
  const canShip = !['pending', 'cancelled'].includes(order.status);
  const defaultCarrier = order.shippingTitle ?? order.shippingMethod?.title ?? 'پست';

  return (
    <>
      <Link href="/admins/orders" className="mb-3 inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 hover:text-sage-700">
        <ArrowRight className="size-3.5" />
        بازگشت به سفارش‌ها
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-[1.25rem] font-semibold text-ink-900" dir="ltr">{order.code}</h1>
            <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
            <Badge tone={PAYMENT_STATUS[order.paymentStatus].tone}>{PAYMENT_STATUS[order.paymentStatus].label}</Badge>
          </div>
          <p className="mt-1 text-[0.75rem] text-ink-400">
            ثبت در {fDateTime(order.createdAt)} · {PAYMENT_METHOD_LABEL[order.paymentMethod]} · {fa(order.itemCount)} قلم
          </p>
        </div>
        <Link href={`/admins/orders/${order.id}/invoice`} className={adminBtn('outline')}>
          <Printer className="size-4" strokeWidth={1.8} />
          فاکتور چاپی
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {/* items */}
          <Panel title="اقلام سفارش">
            <ul className="divide-y divide-line-soft">
              {order.items.map((it) => (
                <li key={String(it.id)} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                    {it.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    {it.productId ? (
                      <Link href={`/admins/products/${it.productId}`} className="line-clamp-1 text-[0.8125rem] font-medium text-ink-900 hover:text-sage-700">
                        {it.productName}
                      </Link>
                    ) : (
                      <p className="line-clamp-1 text-[0.8125rem] font-medium text-ink-900">{it.productName}</p>
                    )}
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.6875rem] text-ink-400">
                      {it.colorName && (
                        <span className="inline-flex items-center gap-1">
                          <span className="size-2.5 rounded-full border border-line" style={{ background: it.colorHex ?? undefined }} />
                          {it.colorName}
                        </span>
                      )}
                      {it.sizeLabel && <span>سایز {it.sizeLabel}</span>}
                      {it.sku && <span className="font-mono" dir="ltr">{it.sku}</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-end text-[0.75rem]">
                    <p className="text-ink-400">{fa(it.quantity)} × {toman(it.unitPrice)}</p>
                    <p className="font-medium text-ink-900">{toman(it.total)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-line-soft pt-3 text-[0.8125rem]">
              <Row label="جمع کالاها" value={toman(order.subtotal)} />
              {order.discount > 0 && <Row label={`تخفیف${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`− ${toman(order.discount)}`} />}
              <Row label={`ارسال${order.shippingTitle ? ` — ${order.shippingTitle}` : ''}`} value={order.shippingCost ? toman(order.shippingCost) : 'رایگان'} />
              <Row label="مالیات بر ارزش افزوده" value={toman(order.tax)} />
              <div className="flex items-center justify-between border-t border-line-soft pt-2 text-[0.875rem] font-semibold text-ink-900">
                <span>مبلغ قابل پرداخت</span>
                <span>{toman(order.total)}</span>
              </div>
            </dl>
          </Panel>

          {/* shipments */}
          <Panel title="ارسال و کد رهگیری مرسوله" description="ثبت کد رهگیری پست/پیک؛ با تغییر وضعیت ارسال، وضعیت سفارش هم به‌روز می‌شود.">
            {!canShip && (
              <p className="mb-3 rounded-lg bg-cream-100 px-3 py-2 text-[0.75rem] text-ink-500">
                ثبت ارسال پس از پرداخت یا تأیید سفارش ممکن است.
              </p>
            )}
            <div className="space-y-4">
              {order.shipments.map((s, i) => (
                <div key={String(s.id)} className="rounded-xl border border-line-soft p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-900">
                      <Truck className="size-4 text-sage-600" strokeWidth={1.8} />
                      مرسولهٔ {fa(i + 1)}
                      <Badge tone={SHIPMENT_STATUS[s.status].tone}>{SHIPMENT_STATUS[s.status].label}</Badge>
                    </p>
                    <p className="text-[0.6875rem] text-ink-400">
                      {s.shippedAt && <>ارسال: {fDateTime(s.shippedAt)} · </>}
                      {s.deliveredAt && <>تحویل: {fDateTime(s.deliveredAt)} · </>}
                      {s.admin?.name && <>توسط {s.admin.name}</>}
                    </p>
                  </div>
                  <ShipmentForm orderId={Number(order.id)} shipment={{
                    id: Number(s.id), carrier: s.carrier ?? '', trackingCode: s.trackingCode ?? '', trackingUrl: s.trackingUrl ?? '', status: s.status, note: s.note ?? '',
                  }} disabled={!canShip} />
                </div>
              ))}
              {canShip && (
                <details className="group rounded-xl border border-dashed border-line p-3" open={order.shipments.length === 0}>
                  <summary className="cursor-pointer list-none text-[0.8125rem] font-medium text-sage-700">
                    + ثبت مرسولهٔ {order.shipments.length ? 'جدید' : ''}
                  </summary>
                  <div className="mt-3">
                    <ShipmentForm orderId={Number(order.id)} shipment={{ id: 0, carrier: defaultCarrier, trackingCode: '', trackingUrl: '', status: 'shipped', note: '' }} />
                  </div>
                </details>
              )}
            </div>
          </Panel>

          {/* payments */}
          <Panel title="تراکنش‌های پرداخت">
            {order.payments.length === 0 ? (
              <p className="text-[0.75rem] text-ink-400">هنوز تراکنشی برای این سفارش ثبت نشده است.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-[0.75rem]">
                  <thead className="text-[0.6875rem] text-ink-400">
                    <tr className="border-b border-line-soft">
                      <th className="py-2 text-start font-medium">درگاه</th>
                      <th className="py-2 text-start font-medium">مبلغ</th>
                      <th className="py-2 text-start font-medium">وضعیت</th>
                      <th className="py-2 text-start font-medium">کد پیگیری بانکی</th>
                      <th className="py-2 text-start font-medium">کارت</th>
                      <th className="py-2 text-start font-medium">تاریخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.payments.map((p) => (
                      <tr key={String(p.id)} className="border-b border-line-soft last:border-0">
                        <td className="py-2">
                          {GATEWAY_LABEL[p.gateway] ?? p.gateway}
                          {p.authority && <p className="max-w-[10rem] truncate font-mono text-[0.625rem] text-ink-300" dir="ltr" title={p.authority}>{p.authority}</p>}
                        </td>
                        <td className="py-2">{toman(p.amount)}</td>
                        <td className="py-2">
                          <Badge tone={TRANSACTION_STATUS[p.status].tone}>{TRANSACTION_STATUS[p.status].label}</Badge>
                          {p.failureReason && <p className="mt-0.5 text-[0.625rem] text-blush-500">{p.failureReason}</p>}
                        </td>
                        <td className="py-2 font-mono" dir="ltr">{p.refId ?? '—'}</td>
                        <td className="py-2 font-mono" dir="ltr">{p.cardPan ?? '—'}</td>
                        <td className="py-2 text-ink-500">{fDateTime(p.paidAt ?? p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* timeline */}
          <Panel title="تاریخچهٔ وضعیت">
            <ol className="space-y-3">
              {[...order.statusHistories].reverse().map((h, i) => (
                <li key={String(h.id)} className="flex gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${i === 0 ? 'bg-sage-500' : 'bg-cream-300'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-ink-800">
                      <Badge tone={ORDER_STATUS[h.status].tone}>{ORDER_STATUS[h.status].label}</Badge>
                      {h.note}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] text-ink-400">
                      {fDateTime(h.createdAt)} · {h.admin?.name ? `مدیر: ${h.admin.name}` : 'سیستم / مشتری'}
                      {!h.isCustomerVisible && ' · فقط داخلی'}
                    </p>
                  </div>
                </li>
              ))}
              {order.statusHistories.length === 0 && <p className="text-[0.75rem] text-ink-400">رویدادی ثبت نشده است.</p>}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="تغییر وضعیت سفارش">
            {next.length === 0 ? (
              <p className="text-[0.75rem] text-ink-400">این سفارش در وضعیت نهایی است و تغییر بیشتری ندارد.</p>
            ) : (
              <ActionForm action={changeStatusAction} className="space-y-3" resetOnSuccess>
                <input type="hidden" name="orderId" value={String(order.id)} />
                <SelectField name="status" label="وضعیت جدید" options={next.map((s) => ({ value: s, label: ORDER_STATUS[s].label }))} required />
                <TextArea name="note" label="توضیح (اختیاری)" rows={2} placeholder="مثلاً: بسته‌بندی انجام شد" />
                <Toggle name="visible" label="نمایش به مشتری" defaultChecked hint="در تاریخچهٔ سفارش مشتری نمایش داده شود" />
                {next.includes('cancelled') && (
                  <p className="text-[0.6875rem] text-ink-400">با لغو سفارش، موجودی اقلام به انبار برمی‌گردد.</p>
                )}
                <SubmitButton className="w-full">ثبت وضعیت</SubmitButton>
              </ActionForm>
            )}
          </Panel>

          <Panel title="مشتری و گیرنده">
            <div className="space-y-3 text-[0.8125rem]">
              <div className="flex items-start gap-2">
                <User className="mt-0.5 size-4 shrink-0 text-sage-600" strokeWidth={1.8} />
                <div>
                  {order.user ? (
                    <Link href={`/admins/users/${order.user.id}`} className="font-medium text-ink-900 hover:text-sage-700">
                      {order.user.name || 'کاربر بدون نام'}
                    </Link>
                  ) : (
                    <p className="text-ink-500">مهمان</p>
                  )}
                  {order.user && <p className="text-[0.6875rem] text-ink-400" dir="ltr">{order.user.phone}</p>}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-sage-600" strokeWidth={1.8} />
                <div className="leading-7 text-ink-600">
                  <p className="font-medium text-ink-900">{order.receiverName} — <span dir="ltr">{order.receiverPhone}</span></p>
                  <p>استان {order.province.name}، شهر {order.city.name}</p>
                  <p>{order.address}{order.unit ? `، ${order.unit}` : ''}</p>
                  <p>کد پستی: <span className="font-mono" dir="ltr">{order.postalCode}</span></p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Package className="mt-0.5 size-4 shrink-0 text-sage-600" strokeWidth={1.8} />
                <p className="text-ink-600">{order.shippingTitle ?? '—'}{order.shippingEta ? ` · ${order.shippingEta}` : ''}</p>
              </div>
              {order.customerNote && (
                <p className="rounded-lg bg-cream-100 px-3 py-2 text-[0.75rem] text-ink-600">یادداشت مشتری: {order.customerNote}</p>
              )}
            </div>
          </Panel>

          <Panel title="یادداشت داخلی مدیر" description="فقط برای مدیران قابل مشاهده است">
            <ActionForm action={saveAdminNoteAction} className="space-y-3">
              <input type="hidden" name="orderId" value={String(order.id)} />
              <TextArea name="adminNote" defaultValue={order.adminNote ?? ''} rows={3} />
              <SubmitButton variant="outline" size="sm">ذخیرهٔ یادداشت</SubmitButton>
            </ActionForm>
          </Panel>

          {order.ip && (
            <p className="px-1 text-[0.625rem] text-ink-300">
              IP: <span dir="ltr">{order.ip}</span>
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-600">
      <span>{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  );
}

function ShipmentForm({
  orderId,
  shipment,
  disabled,
}: {
  orderId: number;
  shipment: { id: number; carrier: string; trackingCode: string; trackingUrl: string; status: string; note: string };
  disabled?: boolean;
}) {
  return (
    <ActionForm action={saveShipmentAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="orderId" value={orderId} />
      {shipment.id > 0 && <input type="hidden" name="shipmentId" value={shipment.id} />}
      <TextField name="carrier" label="حمل‌کننده" defaultValue={shipment.carrier} placeholder="پست پیشتاز، تیپاکس، پیک…" disabled={disabled} />
      <TextField name="trackingCode" label="کد رهگیری مرسوله" defaultValue={shipment.trackingCode} ltr disabled={disabled} />
      <TextField name="trackingUrl" label="نشانی رهگیری (اختیاری)" defaultValue={shipment.trackingUrl} ltr placeholder="https://tracking.post.ir/…" disabled={disabled} />
      <SelectField name="status" label="وضعیت ارسال" defaultValue={shipment.status} options={SHIP_OPTIONS} disabled={disabled} />
      <TextArea name="note" label="توضیح" defaultValue={shipment.note} rows={2} className="sm:col-span-2" disabled={disabled} />
      {!disabled && (
        <div className="sm:col-span-2">
          <SubmitButton size="sm">{shipment.id ? 'به‌روزرسانی مرسوله' : 'ثبت مرسوله'}</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
