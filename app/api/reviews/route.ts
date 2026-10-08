import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_COMMENT = 600;
const recentWrites = new Map<string, number>();
const WINDOW_MS = 60_000;

function text(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function clientKey(request: Request, body: Record<string, unknown>) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'local';
  const phone = text(body.phone, 30).replace(/\D/g, '');
  return `${ip}|${phone || 'anon'}`;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'بيانات التقييم غير مكتملة.' }, { status: 400 });
  }

  const productId = text(body.productId, 60);
  const customerName = text(body.customerName, 60);
  const comment = text(body.comment, MAX_COMMENT);
  const phone = text(body.phone, 30);
  const rating = Math.round(Number(body.rating));

  if (!productId) return NextResponse.json({ error: 'التقييم مرتبط بمنتج غير معروف.' }, { status: 400 });
  if (customerName.length < 2) return NextResponse.json({ error: 'اكتب اسمك من فضلك.' }, { status: 400 });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'اختار تقييم من نجمة لخمس نجوم.' }, { status: 400 });
  if (comment.length < 5) return NextResponse.json({ error: 'اكتب رأيك في خمس كلمات على الأقل.' }, { status: 400 });

  const key = clientKey(request, body);
  const lastWrite = recentWrites.get(key) ?? 0;
  if (Date.now() - lastWrite < WINDOW_MS) {
    return NextResponse.json({ error: 'استنى شوية قبل ما تبعت تقييم تاني.' }, { status: 429 });
  }

  try {
    const productSnapshot = await adminDb.collection('products').doc(productId).get();
    if (!productSnapshot.exists) {
      return NextResponse.json({ error: 'المنتج ده مش موجود.' }, { status: 404 });
    }
    const product = productSnapshot.data() as { name?: string };

    const duplicate = await adminDb
      .collection('reviews')
      .where('productId', '==', productId)
      .where('customerName', '==', customerName)
      .where('comment', '==', comment)
      .limit(1)
      .get();
    if (!duplicate.empty) {
      return NextResponse.json({ error: 'اتبعت نفس التقييم ده قبل كده.' }, { status: 409 });
    }

    const reviewRef = adminDb.collection('reviews').doc();
    await reviewRef.set({
      productId,
      productName: text(product?.name, 90),
      customerName,
      rating,
      comment,
      ...(phone ? { customerPhone: phone } : {}),
      status: 'جديدة',
      createdAt: FieldValue.serverTimestamp(),
    });

    recentWrites.set(key, Date.now());
    if (recentWrites.size > 500) recentWrites.clear();

    return NextResponse.json({ reviewId: reviewRef.id });
  } catch (error) {
    console.error('[reviews/create] Failed to create review', error);
    return NextResponse.json({ error: 'تعذر حفظ التقييم الآن. حاول مرة أخرى بعد قليل.' }, { status: 503 });
  }
}