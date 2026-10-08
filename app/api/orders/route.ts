import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SubmittedLine = { productId: string; quantity: number };
type ProductRecord = {
  name?: string;
  sku?: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  images?: Array<{ url?: string }>;
  imageUrl?: string;
};
type OfferRecord = {
  isActive?: boolean;
  startsOn?: string;
  endsOn?: string;
  productIds?: string[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
};

function text(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function activeOfferPrice(product: ProductRecord, productId: string, offers: OfferRecord[], today: string) {
  const base = Number(product.price) || 0;
  const candidates = Number(product.salePrice) > 0 && Number(product.salePrice) < base ? [Number(product.salePrice)] : [];
  for (const offer of offers) {
    if (!offer.isActive || !offer.productIds?.includes(productId) || today < String(offer.startsOn) || today > String(offer.endsOn)) continue;
    const discount = Number(offer.discountValue) || 0;
    const price = offer.discountType === 'percentage' ? base * (1 - discount / 100) : base - discount;
    if (price > 0 && price < base) candidates.push(price);
  }
  return Math.round(Math.min(base, ...candidates) * 100) / 100;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'بيانات الطلب غير مكتملة.' }, { status: 400 });
  }

  const customerName = text(body.customerName, 100);
  const phone = text(body.phone, 30);
  const email = text(body.email, 120);
  const city = text(body.city, 60);
  const address = text(body.address, 240);
  const shippingArea = text(body.shippingArea, 80);
  const lines = Array.isArray(body.items) ? body.items as SubmittedLine[] : [];
  const phoneDigits = phone.replace(/\D/g, '');

  if (customerName.length < 2 || phoneDigits.length < 8 || !city || address.length < 6 || !shippingArea) {
    return NextResponse.json({ error: 'أكمل الاسم ورقم الهاتف ومكان وعنوان التوصيل.' }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'تأكد من صيغة البريد الإلكتروني.' }, { status: 400 });
  }
  if (!lines.length || lines.length > 100 || lines.some((line) => !line || typeof line.productId !== 'string' || !line.productId || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20)) {
    return NextResponse.json({ error: 'راجع المنتجات والكميات في السلة.' }, { status: 400 });
  }
  const uniqueIds = new Set(lines.map((line) => line.productId));
  if (uniqueIds.size !== lines.length) return NextResponse.json({ error: 'يوجد منتج مكرر في الطلب.' }, { status: 400 });

  try {
    const orderRef = adminDb.collection('orders').doc();
    const customerId = createHash('sha256').update(phoneDigits).digest('hex');
    const customerRef = adminDb.collection('customers').doc(customerId);
    const ratesQuery = adminDb.collection('shippingRates');
    const offerQuery = adminDb.collection('offers').where('isActive', '==', true);
    const productRefs = lines.map((line) => adminDb.collection('products').doc(line.productId));
    const today = new Date().toISOString().slice(0, 10);

    const orderId = await adminDb.runTransaction(async (transaction) => {
      const [productSnapshots, ratesSnapshot, offerSnapshot, customerSnapshot] = await Promise.all([
        Promise.all(productRefs.map((ref) => transaction.get(ref))),
        transaction.get(ratesQuery),
        transaction.get(offerQuery),
        transaction.get(customerRef),
      ]);
      const rateDocument = ratesSnapshot.docs.find((document) => document.data().area === shippingArea && document.data().isActive !== false);

      const offers = offerSnapshot.docs.map((document) => document.data() as OfferRecord);
      let subtotal = 0;
      const orderItems = lines.map((line, index) => {
        const snapshot = productSnapshots[index];
        if (!snapshot.exists) throw new Error('أحد المنتجات لم يعد متاحاً. حدّث الصفحة وحاول مرة أخرى.');
        const product = snapshot.data() as ProductRecord;
        if ((Number(product.stock) || 0) < line.quantity) throw new Error(`الكمية المطلوبة من «${product.name || 'المنتج'}» غير متوفرة حالياً.`);
        const unitPrice = activeOfferPrice(product, snapshot.id, offers, today);
        if (unitPrice <= 0) throw new Error(`سعر «${product.name || 'المنتج'}» غير صالح. تواصل معنا.`);
        const lineTotal = Math.round(unitPrice * line.quantity * 100) / 100;
        subtotal += lineTotal;
        return {
          productId: snapshot.id,
          productName: text(product.name, 90),
          sku: text(product.sku, 24),
          imageUrl: product.images?.[0]?.url || product.imageUrl || '',
          quantity: line.quantity,
          unitPrice,
          lineTotal,
        };
      });
      subtotal = Math.round(subtotal * 100) / 100;
      const shippingCost = rateDocument ? Math.max(0, Number(rateDocument.data().price) || 0) : 0;
      const total = Math.round((subtotal + shippingCost) * 100) / 100;
      const customerData = {
        name: customerName,
        email,
        phone,
        city,
        address,
        updatedAt: FieldValue.serverTimestamp(),
        ...(customerSnapshot.exists
          ? { ordersCount: (Number(customerSnapshot.data()?.ordersCount) || 0) + 1, totalSpent: (Number(customerSnapshot.data()?.totalSpent) || 0) + total }
          : { ordersCount: 1, totalSpent: total, createdAt: FieldValue.serverTimestamp() }),
      };

      transaction.set(customerRef, customerData, { merge: true });
      transaction.create(orderRef, {
        customerId,
        customerName,
        customerPhone: phone,
        customerEmail: email,
        city,
        address,
        shippingArea,
        shippingCost: rateDocument ? shippingCost : null,
        shippingPending: !rateDocument,
        subtotal,
        items: orderItems,
        itemsCount: lines.reduce<number>((sum, line) => sum + line.quantity, 0),
        total,
        status: 'جديد',
        createdAt: FieldValue.serverTimestamp(),
      });
      productSnapshots.forEach((snapshot, index) => transaction.update(snapshot.ref, {
        stock: (Number(snapshot.data()?.stock) || 0) - lines[index].quantity,
        updatedAt: FieldValue.serverTimestamp(),
      }));
      return { orderId: orderRef.id, shippingPending: !rateDocument };
    });

    return NextResponse.json(orderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('الكمية') || message.startsWith('أحد المنتجات') || message.startsWith('منطقة') || message.startsWith('سعر')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error('[orders/create] Failed to create order', error);
    return NextResponse.json({ error: 'تعذر تسجيل الطلب الآن. حاول مرة أخرى بعد قليل.' }, { status: 503 });
  }
}