import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function text(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'بيانات العميل غير مكتملة.' }, { status: 400 });
  }

  const name = text(body.name, 100);
  const phoneDigits = text(body.phone, 30).replace(/\D/g, '');
  const email = text(body.email, 120);
  const city = text(body.city, 60);
  const address = text(body.address, 240);

  if (name.length < 2) return NextResponse.json({ error: 'اكتب اسمك عشان نجهّز طلبك.' }, { status: 400 });
  if (phoneDigits.length < 8) return NextResponse.json({ error: 'رقم الموبايل لازم يكون صحيح.' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة.' }, { status: 400 });
  }

  try {
    const customerId = createHash('sha256').update(phoneDigits).digest('hex');
    const reference = adminDb.collection('customers').doc(customerId);
    const snapshot = await reference.get();
    const existing = snapshot.data() ?? {};

    await reference.set(
      {
        name,
        phone: text(body.phone, 30),
        ...(email ? { email } : {}),
        ...(city ? { city } : {}),
        ...(address ? { address } : {}),
        source: snapshot.exists ? existing.source || 'storefront' : 'storefront',
        ordersCount: Number(existing.ordersCount) || 0,
        totalSpent: Number(existing.totalSpent) || 0,
        ...(snapshot.exists ? {} : { registeredAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true, customerId, returning: snapshot.exists });
  } catch (error) {
    console.error('[customers/upsert] Failed', error);
    return NextResponse.json({ error: 'تعذر حفظ بياناتك دلوقتي. حاول تاني.' }, { status: 503 });
  }
}