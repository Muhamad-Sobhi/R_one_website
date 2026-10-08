'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Check, PackageSearch, Truck } from 'lucide-react';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { CURRENCY_LABEL, formatDateStamp, formatMoney } from '@/lib/store';

type TrackedOrder = {
  orderId: string;
  status: string;
  createdAt: number;
  itemsCount: number;
  subtotal: number;
  shippingCost: number | null;
  total: number;
  shippingArea: string;
  items: Array<{ productName: string; quantity: number; lineTotal: number }>;
};

const STEPS = ['جديد', 'قيد التجهيز', 'تم الشحن', 'مكتمل'];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setOrder(null);
    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, phone }),
      });
      const result = (await response.json()) as TrackedOrder & { error?: string };
      if (!response.ok) throw new Error(result.error || 'مالقيناش الطلب.');
      setOrder(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر البحث دلوقتي.');
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = order ? STEPS.indexOf(order.status) : -1;

  return (
    <StoreLayout>
      <PageHero eyebrow="تتبع" title="تتبع طلبك" description="اكتب رقم الطلب ورقم الموبايل اللي اتسجل بيه وهتشوف حالة الطلب." breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'تتبع طلبك' }]} />

      <PageSection>
        <form className="track-form" onSubmit={submit}>
          <label>
            رقم الطلب
            <input required minLength={4} maxLength={40} dir="ltr" value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="مثال: AB12CD" />
          </label>
          <label>
            رقم الموبايل
            <input required type="tel" dir="ltr" minLength={8} maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01xxxxxxxxx" />
          </label>
          <button className="checkout-button" type="submit" disabled={busy}>
            {busy ? 'بنبحث...' : <>اعرف حالة الطلب <PackageSearch size={16} /></>}
          </button>
        </form>

        {error ? <p className="checkout-error" role="alert">{error}</p> : null}

        {order ? (
          <div className="track-result">
            <div className="track-result-head">
              <div>
                <span className="eyebrow">طلبك</span>
                <h2 dir="ltr">#{order.orderId.slice(-6).toUpperCase()}</h2>
                <small>{formatDateStamp(order.createdAt)} · {order.shippingArea || 'محدد وقت التأكيد'}</small>
              </div>
              <span className="track-status">{order.status}</span>
            </div>

            <ol className="track-steps">
              {STEPS.map((step, index) => (
                <li className={index <= stepIndex ? 'track-step-done' : ''} key={step}>
                  <span>{index < stepIndex ? <Check size={13} /> : index + 1}</span>
                  <small>{step}</small>
                </li>
              ))}
            </ol>

            <ul className="track-items">
              {order.items.map((item, index) => (
                <li key={`${item.productName}-${index}`}>
                  <span>{item.productName} <small>× {item.quantity}</small></span>
                  <strong>{formatMoney(item.lineTotal)} {CURRENCY_LABEL}</strong>
                </li>
              ))}
            </ul>

            <div className="track-totals">
              <div><span>قيمة القطع</span><strong>{formatMoney(order.subtotal)} {CURRENCY_LABEL}</strong></div>
              <div><span>التوصيل</span><strong>{order.shippingCost ? `${formatMoney(order.shippingCost)} ${CURRENCY_LABEL}` : 'يتحدد'}</strong></div>
              <div className="cart-grand-total"><span>الإجمالي</span><strong>{formatMoney(order.total)} {CURRENCY_LABEL}</strong></div>
            </div>

            <Link className="button-dark" href="/products">كمّل التسوق</Link>
          </div>
        ) : !error ? (
          <div className="track-empty">
            <Truck size={22} />
            <p>اكتب بيانات الطلب وهنقولك هو فين دلوقتي.</p>
          </div>
        ) : null}
      </PageSection>
    </StoreLayout>
  );
}
