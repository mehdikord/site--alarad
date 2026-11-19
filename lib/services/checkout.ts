import 'server-only';
import { Prisma } from '@prisma/client';
import { db, toId } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { checkCoupon, shippingCostFor, shippingMethodsFor, totalsOf } from '@/lib/services/pricing';
import { generateOrderCode } from '@/lib/services/orders';
import { isValidIranPhone, isValidPostal, normalizePhone, toLatinDigits } from '@/lib/format';

export interface CheckoutLineInput {
  variantId: string | number;
  qty: number;
}

export interface QuoteInput {
  lines: CheckoutLineInput[];
  provinceId?: string | number | null;
  shippingMethodId?: string | number | null;
  couponCode?: string | null;
  userId?: bigint | null;
}

class CheckoutError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

/** validates cart lines against live stock + prices */
async function priceLines(lines: CheckoutLineInput[]) {
  const wanted = new Map<bigint, number>();
  for (const l of lines.slice(0, 100)) {
    const id = toId(String(l.variantId));
    const qty = Math.floor(Number(l.qty));
    if (!id || !Number.isFinite(qty) || qty <= 0) continue;
    wanted.set(id, (wanted.get(id) ?? 0) + Math.min(qty, 999));
  }
  const variants = await db.productVariant.findMany({
    where: { id: { in: [...wanted.keys()] } },
    include: {
      color: true,
      size: true,
      product: { include: { images: { include: { media: true }, orderBy: { sortOrder: 'asc' } }, category: { select: { isActive: true } } } },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  const priced: {
    variant: (typeof variants)[number];
    unitPrice: number;
    qty: number;
    image: string | null;
  }[] = [];
  const removed: string[] = [];
  const issues: string[] = [];

  for (const [id, qty] of wanted) {
    const v = byId.get(id);
    if (!v || !v.isActive || v.product.status !== 'active' || !v.product.category.isActive) {
      removed.push(String(id));
      issues.push('یکی از کالاهای سبد دیگر موجود نیست و حذف شد.');
      continue;
    }
    if (v.stock <= 0) {
      removed.push(String(id));
      issues.push(`«${v.product.name}» در این رنگ و سایز ناموجود شد.`);
      continue;
    }
    const finalQty = Math.min(qty, v.stock);
    if (finalQty < qty) issues.push(`از «${v.product.name}» تنها ${new Intl.NumberFormat('fa-IR').format(v.stock)} عدد موجود است.`);
    const img =
      v.product.images.find((i) => i.colorId !== null && i.colorId === v.colorId) ??
      v.product.images.find((i) => i.colorId === null) ??
      v.product.images[0];
    priced.push({ variant: v, unitPrice: v.price ?? v.product.price, qty: finalQty, image: img?.media.url ?? null });
  }
  return { priced, removed, issues };
}

export async function quote(input: QuoteInput) {
  const settings = await getSettings();
  const { priced, removed, issues } = await priceLines(input.lines);
  const subtotal = priced.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const itemCount = priced.reduce((s, l) => s + l.qty, 0);

  const provinceId = toId(String(input.provinceId ?? ''));
  const methods = await shippingMethodsFor(provinceId);
  const shippingMethods = methods.map((m) => ({
    id: Number(m.id),
    code: m.code,
    title: m.title,
    description: m.description ?? '',
    eta: m.eta ?? '',
    baseCost: m.cost,
    cost: shippingCostFor(m, subtotal),
    freeShippingThreshold: m.freeShippingThreshold,
    supportsCod: m.supportsCod,
  }));
  const requested = toId(String(input.shippingMethodId ?? ''));
  const selected = shippingMethods.find((m) => requested && BigInt(m.id) === requested) ?? shippingMethods[0] ?? null;

  let coupon: { code: string; amount: number; message: string; id: bigint } | null = null;
  let couponError: string | null = null;
  if (input.couponCode?.trim()) {
    const c = await checkCoupon(input.couponCode, subtotal, input.userId ?? null);
    if (c.ok && c.coupon) coupon = { code: c.coupon.code, amount: c.amount, message: c.message, id: c.coupon.id };
    else couponError = c.message;
  }

  const shipping = selected?.cost ?? 0;
  const totals = { ...totalsOf(subtotal, coupon?.amount ?? 0, shipping, settings.taxRate), itemCount };

  return {
    lines: priced.map((l) => ({
      variantId: String(l.variant.id),
      productId: String(l.variant.productId),
      name: l.variant.product.name,
      unitPrice: l.unitPrice,
      qty: l.qty,
      maxStock: l.variant.stock,
    })),
    removed,
    issues: [...new Set(issues)],
    shippingMethods,
    selectedShippingId: selected?.id ?? null,
    coupon: coupon ? { code: coupon.code, amount: coupon.amount, message: coupon.message } : null,
    couponError,
    totals,
    codAvailable: settings.codEnabled && !!selected?.supportsCod,
    taxRate: settings.taxRate,
    _internal: { priced, selectedMethodId: selected ? BigInt(selected.id) : null, couponId: coupon?.id ?? null },
  };
}

export interface PlaceOrderInput extends QuoteInput {
  receiver: {
    fullName: string;
    phone: string;
    provinceId: string | number | null;
    cityId: string | number | null;
    postalCode: string;
    line1: string;
    line2?: string | null;
    notes?: string | null;
  };
  paymentMethod: 'online' | 'cod';
  saveAddress?: boolean;
  addressId?: string | number | null;
  ip?: string | null;
  userAgent?: string | null;
}

/** validates the receiver block; returns field → message */
export async function validateReceiver(r: PlaceOrderInput['receiver']) {
  const errors: Record<string, string> = {};
  if (!r.fullName || r.fullName.trim().length < 3) errors.fullName = 'نام و نام خانوادگی را کامل وارد کنید.';
  if (!isValidIranPhone(r.phone ?? '')) errors.phone = 'شمارهٔ همراه معتبر نیست.';
  if (!isValidPostal(r.postalCode ?? '')) errors.postalCode = 'کد پستی باید ۱۰ رقم باشد.';
  if (!r.line1 || r.line1.trim().length < 10) errors.line1 = 'نشانی را کامل‌تر بنویسید (خیابان، کوچه، پلاک).';
  const provinceId = toId(String(r.provinceId ?? ''));
  const cityId = toId(String(r.cityId ?? ''));
  if (!provinceId) errors.provinceId = 'استان را انتخاب کنید.';
  if (!cityId) errors.cityId = 'شهر را انتخاب کنید.';
  if (provinceId && cityId) {
    const city = await db.city.findUnique({ where: { id: cityId } });
    if (!city || city.provinceId !== provinceId) errors.cityId = 'شهر انتخاب‌شده با استان هم‌خوانی ندارد.';
  }
  return { errors, provinceId, cityId };
}

/**
 * Creates the order inside a transaction: re-prices, atomically reserves stock,
 * records coupon usage and the first timeline entry.
 */
export async function placeOrder(input: PlaceOrderInput, userId: bigint) {
  const settings = await getSettings();
  const { errors, provinceId, cityId } = await validateReceiver(input.receiver);
  if (Object.keys(errors).length) return { ok: false as const, message: 'اطلاعات گیرنده را بررسی کنید.', errors };

  const q = await quote({ ...input, provinceId: String(provinceId), userId });
  if (!q._internal.priced.length) return { ok: false as const, message: 'سبد خرید شما خالی است یا کالاها ناموجود شده‌اند.', quote: q };
  // stock / availability changed since the cart was filled → let the customer review it first
  if (q.issues.length) return { ok: false as const, message: q.issues[0], quote: q, cartChanged: true };
  if (!q._internal.selectedMethodId) return { ok: false as const, message: 'برای این استان روش ارسالی فعال نیست.' };
  const requestedMethod = toId(String(input.shippingMethodId ?? ''));
  if (requestedMethod && requestedMethod !== q._internal.selectedMethodId)
    return { ok: false as const, message: 'روش ارسال انتخاب‌شده برای این استان در دسترس نیست.' };
  if (input.couponCode?.trim() && q.couponError) return { ok: false as const, message: q.couponError };
  if (input.paymentMethod === 'cod' && !q.codAvailable)
    return { ok: false as const, message: 'پرداخت در محل برای این روش ارسال فعال نیست.' };

  const method = q.shippingMethods.find((m) => m.id === q.selectedShippingId)!;
  const r = input.receiver;
  const receiverPhone = normalizePhone(r.phone);
  const postalCode = toLatinDigits(r.postalCode).replace(/\D/g, '');

  try {
    const order = await db.$transaction(
      async (tx) => {
        // 1) reserve stock atomically (fails if someone bought it first)
        for (const l of q._internal.priced) {
          const res = await tx.productVariant.updateMany({
            where: { id: l.variant.id, isActive: true, stock: { gte: l.qty } },
            data: { stock: { decrement: l.qty } },
          });
          if (res.count !== 1) throw new CheckoutError(`موجودی «${l.variant.product.name}» همین حالا تمام شد.`);
        }

        // 2) coupon usage limit (atomic)
        if (q._internal.couponId) {
          const c = await tx.coupon.findUniqueOrThrow({ where: { id: q._internal.couponId } });
          const res = await tx.coupon.updateMany({
            where: { id: c.id, ...(c.usageLimit !== null ? { usedCount: { lt: c.usageLimit } } : {}) },
            data: { usedCount: { increment: 1 } },
          });
          if (res.count !== 1) throw new CheckoutError('ظرفیت این کد تخفیف همین حالا تکمیل شد.');
        }

        // 3) optional address book entry
        let addressId: bigint | null = toId(String(input.addressId ?? ''));
        if (addressId) {
          const owned = await tx.address.findFirst({ where: { id: addressId, userId } });
          if (!owned) addressId = null;
        }
        if (!addressId && input.saveAddress) {
          const count = await tx.address.count({ where: { userId } });
          const addr = await tx.address.create({
            data: {
              userId,
              receiverName: r.fullName.trim(),
              receiverPhone,
              provinceId: provinceId!,
              cityId: cityId!,
              postalCode,
              address: r.line1.trim().slice(0, 500),
              unit: r.line2?.trim().slice(0, 255) || null,
              isDefault: count === 0,
            },
          });
          addressId = addr.id;
        }

        // 4) order + items
        const code = await generateOrderCode(settings.orderCodePrefix, tx);
        const isCod = input.paymentMethod === 'cod';
        const created = await tx.order.create({
          data: {
            code,
            userId,
            addressId,
            shippingMethodId: BigInt(method.id),
            couponId: q._internal.couponId,
            status: isCod ? 'processing' : 'pending',
            paymentStatus: 'unpaid',
            paymentMethod: input.paymentMethod,
            receiverName: r.fullName.trim().slice(0, 255),
            receiverPhone,
            provinceId: provinceId!,
            cityId: cityId!,
            postalCode,
            address: r.line1.trim().slice(0, 500),
            unit: r.line2?.trim().slice(0, 255) || null,
            customerNote: r.notes?.trim().slice(0, 1000) || null,
            itemCount: q.totals.itemCount,
            subtotal: q.totals.subtotal,
            discount: q.totals.discount,
            shippingCost: q.totals.shipping,
            tax: q.totals.tax,
            total: q.totals.total,
            couponCode: q.coupon?.code ?? null,
            shippingTitle: method.title,
            shippingEta: method.eta,
            ip: input.ip ?? null,
            userAgent: input.userAgent ?? null,
            items: {
              create: q._internal.priced.map((l) => ({
                productId: l.variant.productId,
                variantId: l.variant.id,
                productName: l.variant.product.name,
                productSlug: l.variant.product.slug,
                sku: l.variant.sku,
                colorName: l.variant.color?.name ?? null,
                colorHex: l.variant.color?.hex ?? null,
                sizeLabel: l.variant.size?.label ?? null,
                imageUrl: l.image,
                unitPrice: l.unitPrice,
                quantity: l.qty,
                total: l.unitPrice * l.qty,
              })),
            },
            statusHistories: {
              create: [
                { status: 'pending', note: 'سفارش ثبت شد' },
                ...(isCod ? [{ fromStatus: 'pending' as const, status: 'processing' as const, note: 'پرداخت در محل — در حال آماده‌سازی' }] : []),
              ],
            },
          },
        });

        if (q._internal.couponId)
          await tx.couponUsage.create({ data: { couponId: q._internal.couponId, userId, orderId: created.id, amount: q.totals.discount } });

        if (isCod) {
          await tx.payment.create({
            data: { orderId: created.id, userId, gateway: 'cod', amount: created.total, description: `پرداخت در محل سفارش ${code}` },
          });
          for (const l of q._internal.priced)
            await tx.product.update({ where: { id: l.variant.productId }, data: { salesCount: { increment: l.qty } } });
        }
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 20_000 },
    );
    return { ok: true as const, order };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false as const, message: e.message, cartChanged: true };
    throw e;
  }
}
