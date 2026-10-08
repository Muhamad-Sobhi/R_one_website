import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: 'اكتب بريدك الإلكتروني.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 120) : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'تأكد من صيغة البريد الإلكتروني.' }, { status: 400 });
  }

  try {
    const subscribers = adminDb.collection('newsletter');
    const existing = await subscribers.where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ message: 'أنت مشترك بالفعل في النشرة.' });
    }

    await subscribers.add({ email, source: 'storefront', createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ message: 'تمام! هنبعتلك كل جديد على الإيميل.' });
  } catch (error) {
    console.error('[newsletter] Failed to subscribe', error);
    return NextResponse.json({ error: 'تعذر الاشتراك دلوقتي. حاول تاني.' }, { status: 503 });
  }
}