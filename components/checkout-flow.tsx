'use client';

import Link from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Check, MapPin, PackageCheck, ShieldCheck } from 'lucide-react';
import { useToast } from '@/lib/hooks';
import {
  type ResolvedProduct,
  type ShippingRate,
  CURRENCY_LABEL,
  formatMoney,
  formatPrice,
  maxOrderQuantity,
} from '@/lib/store';

export type CheckoutForm = { customerName: string; phone: string; city: string; address: string; shippingArea: string };

type CartItem = ResolvedProduct & { quantity: number; size?: string; color?: string };

type CheckoutFlowProps = {
  items: CartItem[];
  rates: ShippingRate[];
  brand?: string;
  whatsapp?: string;
  form: CheckoutForm;
  onFormChange: (form: CheckoutForm) => void;
  onSuccess: (orderId: string, shippingPending: boolean) => void;
  footer?: ReactNode;
};

const checkoutCookieName = 'r-one-checkout';

function saveDetails(details: CheckoutForm) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${checkoutCookieName}=${encodeURIComponent(JSON.stringify(details))}; Max-Age=7776000; Path=/; SameSite=Lax${secure}`;
}

function clearDetails() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${checkoutCookieName}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

export function readSavedDetails(): CheckoutForm | null {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${checkoutCookieName}=`));
  if (!cookie) return null;
  try {
    const values = JSON.parse(decodeURIComponent(cookie.slice(checkoutCookieName.length + 1))) as Record<string, unknown>;
    if (typeof values.customerName !== 'string' || typeof values.phone !== 'string') return null;
    return {
      customerName: values.customerName.slice(0, 100),
      phone: values.phone.slice(0, 30),
      city: typeof values.city === 'string' ? values.city.slice(0, 60) : '',
      address: typeof values.address === 'string' ? values.address.slice(0, 240) : '',
      shippingArea: typeof values.shippingArea === 'string' ? values.shippingArea.slice(0, 80) : '',
    };
  } catch {
    return null;
  }
}

export default function CheckoutFlow({ items, rates, brand, whatsapp, form, onFormChange, onSuccess, footer }: CheckoutFlowProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [placed, setPlaced] = useState<{ orderId: string; shippingPending: boolean } | null>(null);

  const selectedRate = rates.find((rate) => rate.area === form.shippingArea);
  const subtotal = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const shippingCost = selectedRate?.price || 0;
  const total = subtotal + shippingCost;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items: items.map((item) => ({ productId: item.id, quantity: item.quantity, size: item.size, color: item.color })) }),
      });
      const result = (await response.json()) as { error?: string; orderId?: string; shippingPending?: boolean };
      if (!response.ok || !result.orderId) throw new Error(result.error || 'تعذر تسجيل الطلب.');
      if (remember) saveDetails(form);
      else clearDetails();
      setPlaced({ orderId: result.orderId, shippingPending: result.shippingPending === true });
      onSuccess(result.orderId, result.shippingPending === true);
      showToast('تم تأكيد طلبك.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر تسجيل الطلب. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <div className="checkout-success">
        <span><Check size={24} /></span>
        <h2>طلبك اتسجّل بنجاح</h2>
        <p>رقم الطلب</p>
        <strong dir="ltr">#{placed.orderId.slice(-6).toUpperCase()}</strong>
        <ul>
          <li><Check size={14} /> هنكلمك على رقمك لتأكيد التفاصيل</li>
          <li><Check size={14} /> التوصيل حسب المنطقة والموعد المتفق عليه</li>
          <li><Check size={14} /> الدفع عند الاستلام</li>
        </ul>
        {placed.shippingPending && whatsapp ? (
          <a className="button-dark" href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً، أريد تأكيد تكلفة الشحن لطلبي رقم ${placed.orderId}.`)}`} target="_blank" rel="noreferrer">
            أكد الشحن على واتساب
          </a>
        ) : null}
        <Link className="link-underline" href="/products">كمّل التسوق <ArrowLeft size={15} /></Link>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <form className="checkout-form checkout-form-card" onSubmit={submit}>
        <div className="checkout-step">
          <span className="checkout-step-number">1</span>
          <div>
            <strong>بيانات العميل</strong>
            <small>حتى نقدر نتواصل معاك</small>
          </div>
        </div>
        <label>
          الاسم بالكامل
          <input autoComplete="name" required maxLength={100} value={form.customerName} onChange={(event) => onFormChange({ ...form, customerName: event.target.value })} placeholder="اكتب اسمك" />
        </label>
        <label>
          رقم الموبايل
          <input autoComplete="tel" type="tel" dir="ltr" required minLength={8} maxLength={30} value={form.phone} onChange={(event) => onFormChange({ ...form, phone: event.target.value })} placeholder="01xxxxxxxxx" />
        </label>

        <div className="checkout-step">
          <span className="checkout-step-number">2</span>
          <div>
            <strong>عنوان التوصيل</strong>
            <small>المحافظة والمدينة والعنوان بالتفصيل</small>
          </div>
        </div>
        <div className="checkout-two">
          <label>
            المحافظة / منطقة التوصيل
            <input
              autoComplete="address-level1"
              list="checkout-shipping-areas"
              required
              maxLength={80}
              value={form.shippingArea}
              onChange={(event) => onFormChange({ ...form, shippingArea: event.target.value, city: form.city || event.target.value })}
              placeholder="اكتب المحافظة أو المنطقة"
            />
            <datalist id="checkout-shipping-areas">
              {rates.map((rate) => (
                <option key={rate.id} value={rate.area} label={`${formatPrice(rate.price)} · ${rate.deliveryDays} أيام`} />
              ))}
            </datalist>
            <small className="shipping-field-hint">
              {selectedRate ? `الشحن ${formatPrice(selectedRate.price)} · ${selectedRate.deliveryDays} أيام عمل` : 'اكتب منطقتك وهنأكد تكلفة الشحن معاك.'}
            </small>
          </label>
          <label>
            المدينة / المركز
            <input autoComplete="address-level2" required maxLength={60} value={form.city} onChange={(event) => onFormChange({ ...form, city: event.target.value })} placeholder="المدينة أو المركز" />
          </label>
        </div>
        <label>
          العنوان بالتفصيل
          <input autoComplete="street-address" required minLength={6} maxLength={240} value={form.address} onChange={(event) => onFormChange({ ...form, address: event.target.value })} placeholder="الشارع، رقم العمارة، الدور، علامة مميزة" />
        </label>

        <label className="checkout-remember">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          <span>احفظ بياناتي على هذا الجهاز <small>عشان الطلب الجاي أسرع (90 يوم)</small></span>
        </label>

        {selectedRate ? (
          <div className="delivery-estimate">
            <PackageCheck size={16} />
            <span>التوصيل إلى {selectedRate.area}</span>
            <strong>{formatPrice(shippingCost)}</strong>
            <small>{selectedRate.deliveryDays} أيام عمل</small>
          </div>
        ) : (
          <div className="delivery-pending-note">
            <MapPin size={16} />
            <span>هنأكد تكلفة وموعد التوصيل قبل تجهيز الطلب.</span>
          </div>
        )}

        {error ? <p className="checkout-error" role="alert">{error}</p> : null}

        <button className="checkout-button" type="submit" disabled={busy || !items.length}>
          {busy ? 'جارٍ تأكيد الطلب...' : <>أكد الطلب — {formatMoney(total)} {CURRENCY_LABEL} <ArrowLeft size={17} /></>}
        </button>
        <p className="checkout-note">دفع عند الاستلام · تأكيد الطلب على واتساب</p>
      </form>

      <aside className="checkout-summary-card">
        <h2>ملخص الطلب</h2>
        <ul className="checkout-summary-items">
          {items.map((item) => (
            <li key={item.id}>
              <span className="checkout-summary-image" style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}>
                <b>{item.quantity}</b>
              </span>
              <span className="checkout-summary-copy">
                <strong>{item.name}</strong>
                <small>{[item.color, item.size].filter(Boolean).join(' · ') || item.sku || item.categoryLabel}</small>
              </span>
              <span className="checkout-summary-price">{formatMoney(item.salePrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="checkout-summary-rows">
          <div><span>قيمة القطع</span><strong>{formatMoney(subtotal)} {CURRENCY_LABEL}</strong></div>
          <div><span>التوصيل</span><strong>{selectedRate ? `${formatMoney(shippingCost)} ${CURRENCY_LABEL}` : 'يتحدد معاك'}</strong></div>
          <div className="cart-grand-total"><span>الإجمالي</span><strong>{formatMoney(total)} {CURRENCY_LABEL}</strong></div>
        </div>
        <div className="checkout-trust">
          <span><ShieldCheck size={15} /> بياناتك محفوظة</span>
          <span><PackageCheck size={15} /> تأكيد قبل الشحن</span>
          <span><Check size={15} /> استبدال خلال 14 يوم</span>
        </div>
        {footer}
      </aside>
    </div>
  );
}

export function cartItemsFrom(
  products: ResolvedProduct[],
  lines: Array<{ productId: string; quantity: number; size?: string; color?: string }>,
): CartItem[] {
  return lines
    .map((line): CartItem | null => {
      const product = products.find((item) => item.id === line.productId);
      if (!product) return null;
      const quantity = Math.min(line.quantity, maxOrderQuantity(product, line.size));
      return quantity > 0 ? { ...product, quantity, size: line.size, color: line.color } : null;
    })
    .filter((item): item is CartItem => item !== null);
}
