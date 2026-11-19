import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { MockGateway } from './mock-gateway';

export const metadata: Metadata = { title: 'درگاه پرداخت آزمایشی', robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Local stand-in for a bank page (PAYMENT_DRIVER=mock). */
export default async function MockGatewayPage({ params }: { params: Promise<{ authority: string }> }) {
  const { authority } = await params;
  const payment = await db.payment.findFirst({ where: { authority, gateway: 'mock' }, include: { order: true } });
  if (!payment) notFound();
  return (
    <MockGateway
      paymentId={Number(payment.id)}
      authority={authority}
      amount={payment.amount}
      orderCode={payment.order.code}
      closed={payment.status !== 'pending'}
    />
  );
}
