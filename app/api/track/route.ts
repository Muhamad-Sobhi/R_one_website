import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: { orderId?: unknown; phone?: unknown };
  try {
    body = (await request.json()) as { orderId?: unknown; phone?: unknown };
  } catch {
    return NextResponse.json({ error: 'اكتب رقم الطلب ورقم الموبايل.' }, { status: 400 });
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim().slice(0, 40) : '';
  const phoneDigits = (typeof body.phone === 'string' ? body.phone : '').replace(/\D/g, '');

  if (orderId.length < 4 || phoneDigits.length < 8) {
    return NextResponse.json({ error: 'رقم الطلب أو الموبايل غير كامل.' }, { status: 400 });
  }

  try {
    const snapshot = await adminDb.collection('orders').orderBy('createdAt', 'desc').limit(60).get();

    const match = snapshot.docs
      .map((document) => ({ id: document.id, data: document.data() }))
      .reverse()
      .find((entry) => {
        const customerPhone = String(entry.data.customerPhone ?? '').replace(/\D/g, '');
        const suffix = entry.id.slice(-6).toUpperCase();
        const matchesPhone = customerPhone === phoneDigits || customerPhone.endsWith(phoneDigits) || phoneDigits.endsWith(customerPhone);
        const matchesId = entry.id === orderId || suffix === orderId.toUpperCase() || orderId.toUpperCase().endsWith(suffix);
        return matchesPhone && matchesId;
      });

    if (!match) return NextResponse.json({ error: 'مالقيناش طلب بالبيانات دي. تأكد من رقم الطلب والرقم اللي اتسجل بيه.' }, { status: 404 });

    const data = match.data as {
      status?: string;
      createdAt?: { toMillis?: () => number } | number;
      itemsCount?: number;
      subtotal?: number;
      shippingCost?: number | null;
      total?: number;
      shippingArea?: string;
      items?: Array<{ productName?: string; quantity?: number; lineTotal?: number }>;
    };

    const createdAt = typeof data.createdAt === 'number'
      ? data.createdAt
      : typeof (data.createdAt as { toMillis?: () => number })?.toMillis === 'function'
        ? (data.createdAt as { toMillis: () => number }).toMillis()
        : 0;

    return NextResponse.json({
      orderId: match.id,
      status: data.status ?? 'جديد',
      createdAt,
      itemsCount: data.itemsCount ?? data.items?.length ?? 0,
      subtotal: data.subtotal ?? 0,
      shippingCost: data.shippingCost ?? null,
      total: data.total ?? 0,
      shippingArea: data.shippingArea ?? '',
      items: (data.items ?? []).slice(0, 12).map((item) => ({
        productName: item.productName ?? 'منتج',
        quantity: item.quantity ?? 1,
        lineTotal: item.lineTotal ?? 0,
      })),
    });
  } catch (error) {
    console.error('[track] Failed to lookup order', error);
    return NextResponse.json({ error: 'تعذر البحث دلوقتي. حاول تاني بعد قليل.' }, { status: 503 });
  }
}