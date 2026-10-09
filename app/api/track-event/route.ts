import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TrackBody = {
  event?: 'view' | 'search' | 'contact' | 'add_to_cart' | 'whatsapp' | 'checkout_start';
  productId?: string;
  productName?: string;
  query?: string;
  results?: number;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  source?: string;
};

const DAILY = 'dailyStats';
const recentSeen = new Map<string, number>();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ipKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (forwarded || request.headers.get('x-real-ip') || 'local').replace(/[^a-zA-Z0-9.:]/g, '');
}

/** naive per-day dedupe so one visitor doesn't inflate the numbers */
function oncePerDay(key: string) {
  const now = Date.now();
  const entry = recentSeen.get(key);
  if (entry && now - entry < 60_000 * 60 * 24) return false;
  if (recentSeen.size > 2000) recentSeen.clear();
  recentSeen.set(key, now);
  return true;
}

async function bumpDaily(field: string, extra: Record<string, unknown> = {}) {
  const ref = adminDb.collection(DAILY).doc(todayKey());
  await ref.set(
    {
      date: todayKey(),
      [field]: FieldValue.increment(1),
      ...extra,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function POST(request: Request) {
  let body: TrackBody;
  try {
    body = (await request.json()) as TrackBody;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = ipKey(request);
  const event = body.event;

  try {
    if (event === 'view' && typeof body.productId === 'string' && body.productId.length < 80) {
      if (oncePerDay(`view:${ip}:${body.productId}`)) {
        await adminDb.collection('productStats').doc(body.productId).set(
          { productId: body.productId, productName: String(body.productName ?? '').slice(0, 90), views: FieldValue.increment(1), lastViewedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
        await bumpDaily('views');
      }
      return NextResponse.json({ ok: true });
    }

    if (event === 'search') {
      const term = String(body.query ?? '').trim().slice(0, 80);
      if (!term) return NextResponse.json({ ok: false }, { status: 400 });
      if (oncePerDay(`search:${ip}:${term}`)) {
        await adminDb.collection('searchLogs').add({
          term,
          results: Number(body.results) || 0,
          source: String(body.source ?? 'storefront').slice(0, 30),
          createdAt: FieldValue.serverTimestamp(),
        });
        await bumpDaily('searches');
      }
      return NextResponse.json({ ok: true });
    }

    if (event === 'contact') {
      const name = String(body.name ?? '').trim().slice(0, 80);
      const message = String(body.message ?? '').trim().slice(0, 2000);
      if (name.length < 2 || message.length < 5) return NextResponse.json({ ok: false }, { status: 400 });
      const ref = adminDb.collection('messages').doc();
      await ref.set({
        name,
        phone: String(body.phone ?? '').trim().slice(0, 30),
        email: String(body.email ?? '').trim().slice(0, 120),
        message,
        source: String(body.source ?? 'contact-page').slice(0, 30),
        status: 'جديدة',
        createdAt: FieldValue.serverTimestamp(),
      });
      await bumpDaily('messages');
      return NextResponse.json({ ok: true, id: ref.id });
    }

    if (event === 'add_to_cart' && typeof body.productId === 'string') {
      await adminDb.collection('productStats').doc(body.productId).set(
        {
          productId: body.productId,
          productName: String(body.productName ?? '').slice(0, 90),
          carts: FieldValue.increment(1),
          lastCartedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      await bumpDaily('addToCarts');
      return NextResponse.json({ ok: true });
    }

    if (event === 'whatsapp') {
      await bumpDaily('whatsappClicks');
      return NextResponse.json({ ok: true });
    }

    if (event === 'checkout_start') {
      await bumpDaily('checkoutStarts');
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  } catch (error) {
    console.error('[track] failed', event, error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}