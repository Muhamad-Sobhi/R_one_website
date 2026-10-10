'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, LoaderCircle, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useOverlayLock } from '@/lib/hooks';
import { formatPrice, type ShippingRate } from '@/lib/store';

const STORAGE_KEY = 'r-one-customer';

export type CustomerProfile = { name: string; phone: string; email: string; city: string; address: string };

export type OrderItemInput = { productId: string; quantity: number; size?: string; color?: string };

export function readCustomer(): CustomerProfile {
  if (typeof window === 'undefined') return { name: '', phone: '', email: '', city: '', address: '' };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<CustomerProfile>;
    return { name: saved.name ?? '', phone: saved.phone ?? '', email: saved.email ?? '', city: saved.city ?? '', address: saved.address ?? '' };
  } catch {
    return { name: '', phone: '', email: '', city: '', address: '' };
  }
}

function saveCustomer(profile: CustomerProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable — not critical */
  }
}

type CustomerGateProps = {
  open: boolean;
  onClose: () => void;
  onVerified?: (profile: CustomerProfile) => void;
  /** When set, the gate also files a real order so it shows up in the dashboard. */
  orderItems?: OrderItemInput[];
  rates?: ShippingRate[];
  onOrderCreated?: (orderId: string, shippingPending: boolean) => void;
  reason?: string;
};

/**
 * Gate before handing the customer over to WhatsApp:
 * we register them in Firestore (customers collection) first, and when the
 * caller passes `orderItems` we also create the order so it lands in the
 * dashboard orders section with the stock reserved.
 */
export default function CustomerGate({ open, onClose, onVerified, orderItems, rates = [], onOrderCreated, reason }: CustomerGateProps) {
  const [form, setForm] = useState<CustomerProfile>({ name: '', phone: '', email: '', city: '', address: '' });
  const [shippingArea, setShippingArea] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [known, setKnown] = useState(false);

  const wantsOrder = Boolean(orderItems?.length);
  const selectedRate = rates.find((rate) => rate.area === shippingArea && rate.isActive);

  useOverlayLock(open, onClose);

  useEffect(() => {
    if (!open) return;
    const saved = readCustomer();
    setForm(saved);
    setShippingArea(saved.city || '');
    setKnown(Boolean(saved.name && saved.phone));
    setError('');
  }, [open]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const customer: CustomerProfile = { ...form, city: shippingArea || form.city };
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'تعذر حفظ بياناتك.');
      saveCustomer(customer);

      if (wantsOrder) {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: customer.name,
            phone: customer.phone,
            ...(customer.email ? { email: customer.email } : {}),
            city: customer.city,
            address: customer.address,
            shippingArea: customer.city,
            source: 'whatsapp',
            items: orderItems,
          }),
        });
        const orderResult = (await orderResponse.json()) as { error?: string; orderId?: string; shippingPending?: boolean };
        if (!orderResponse.ok || !orderResult.orderId) throw new Error(orderResult.error || 'تعذر تسجيل الطلب.');
        onOrderCreated?.(orderResult.orderId, orderResult.shippingPending === true);
        return;
      }

      onVerified?.(customer);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ بياناتك.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="customer-gate" role="dialog" aria-modal="true" aria-labelledby="customer-gate-title">
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">بياناتك</span>
            <h2 id="customer-gate-title">{wantsOrder ? 'سجّل بياناتك ونجهّز طلبك' : 'من فضلك سجّل بياناتك'}</h2>
          </div>
          <button className="icon-button" type="button" title="إغلاق" aria-label="إغلاق" onClick={onClose} disabled={busy}><X size={19} /></button>
        </div>

        <p className="customer-gate-note">
          {reason || 'بنحفظ بياناتك عشان نجهّز طلبك على واتساب وتتابع معاك لحد ما يوصلك.'}
        </p>

        <form className="checkout-form" onSubmit={submit}>
          <label>
            الاسم بالكامل
            <input required maxLength={100} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="اكتب اسمك" />
          </label>
          <label>
            رقم الموبايل
            <input required type="tel" dir="ltr" minLength={8} maxLength={30} autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01xxxxxxxxx" />
          </label>
          <label>
            المحافظة / منطقة التوصيل
            <input
              list="customer-gate-areas"
              autoComplete="address-level1"
              required={wantsOrder}
              maxLength={80}
              value={shippingArea}
              onChange={(event) => setShippingArea(event.target.value)}
              placeholder="اكتب المحافظة أو المنطقة"
            />
            <datalist id="customer-gate-areas">
              {rates.map((rate) => (
                <option key={rate.id} value={rate.area} label={`${formatPrice(rate.price)} · ${rate.deliveryDays} أيام`} />
              ))}
            </datalist>
            {selectedRate ? <small className="shipping-field-hint">الشحن {formatPrice(selectedRate.price)} · {selectedRate.deliveryDays} أيام عمل</small> : null}
          </label>
          <label>
            العنوان بالتفصيل
            <input
              required={wantsOrder}
              minLength={wantsOrder ? 6 : undefined}
              maxLength={240}
              autoComplete="street-address"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="المدينة، الشارع، رقم العمارة والدور"
            />
          </label>

          {error ? <p className="checkout-error" role="alert">{error}</p> : null}
          {known ? <p className="customer-gate-known"><Check size={13} /> بياناتك محفوظة على هذا الجهاز من قبل.</p> : null}

          <button className="checkout-button" type="submit" disabled={busy}>
            {busy ? <><LoaderCircle className="spin-icon" size={15} /> بنحفظ بياناتك...</> : <>حفظ ومتابعة لواتساب <Check size={16} /></>}
          </button>
          <p className="checkout-note"><UserPlus size={12} /> بنسجّل بياناتك في قائمة عملائنا عشان نتابع طلبك.</p>
          <p className="checkout-note"><ShieldCheck size={12} /> بياناتك متحفوظة وبتستخدم فقط لتوصيل الطلب.</p>
        </form>
      </section>
    </div>
  );
}