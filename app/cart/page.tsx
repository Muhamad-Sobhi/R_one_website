'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Check, MessageCircle, Minus, PackageCheck, Plus, ShoppingBag, Trash2, Zap } from 'lucide-react';
import CustomerGate, { type CustomerProfile } from '@/components/customer-gate';
import { cartItemsFrom } from '@/components/checkout-flow';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useCart, useStoreData } from '@/lib/hooks';
import { trackEvent } from '@/lib/analytics';
import { CURRENCY_LABEL, formatMoney, formatPrice } from '@/lib/store';

export default function CartPage() {
  const { products, available, rates, profile } = useStoreData();
  const cart = useCart(products);
  const items = useMemo(() => cartItemsFrom(available, cart.lines), [available, cart.lines]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const rate = rates.find((entry) => entry.isActive);
  const [gateOpen, setGateOpen] = useState(false);

  function buildMessage(customer?: CustomerProfile) {
    const lines = [
      `*طلب كل الشنطة من R/ONE*`,
      ...(customer ? [`العميل: ${customer.name}${customer.phone ? ` (${customer.phone})` : ''}${customer.address ? `\nالعنوان: ${customer.address}` : ''}`] : []),
      '',
      ...items.map((item) => {
        const options = [item.color, item.size].filter(Boolean).join(' · ');
        return `• ${item.name}${options ? ` — ${options}` : ''} × ${item.quantity} = ${formatPrice(item.salePrice * item.quantity)}`;
      }),
      '',
      `إجمالي المنتجات: ${formatPrice(subtotal)} ${CURRENCY_LABEL}`,
      ...(rate ? `التوصيل المتوقع: ${formatPrice(rate.price)} ${CURRENCY_LABEL}` : []),
      'أرجو تأكيد الطلب وموعد التوصيل.',
    ];
    return lines.join('\n');
  }

  function buyAllViaWhatsApp(customer?: CustomerProfile) {
    const phone = profile.whatsapp?.replace(/\D/g, '') ?? '';
    if (!phone) return;
    trackEvent({ event: 'whatsapp' });
    const digits = phone.startsWith('0') ? `20${phone.slice(1)}` : phone;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(buildMessage(customer))}`, '_blank', 'noreferrer');
  }

  return (
    <StoreLayout>
      <PageHero eyebrow="طلبك" title="سلة التسوق" description={`${count} قطعة في الشنطة`} breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'السلة' }]} />

      <PageSection>
        {items.length ? (
          <div className="cart-page-layout">
            <ul className="cart-page-items">
              {items.map((item) => (
                <li className="cart-page-item" key={item.id}>
                  <Link className="cart-page-media" href={`/product/${item.id}`}>
                    {item.image ? <Image src={item.image} alt={item.name} fill sizes="120px" /> : <span>R/</span>}
                  </Link>
                  <div className="cart-page-copy">
                    <span className="eyebrow">{item.categoryLabel}</span>
                    <Link href={`/product/${item.id}`}>{item.name}</Link>
                    <small>
                      {formatMoney(item.salePrice)} {CURRENCY_LABEL}
                      {item.discounted ? <del>{formatMoney(item.price)}</del> : null}
                    </small>
                    <div className="cart-page-actions">
                      <div className="quantity-stepper">
                        <button type="button" aria-label="تقليل" onClick={() => cart.changeQuantity(item.id, item.quantity - 1)}><Minus size={13} /></button>
                        <span>{item.quantity}</span>
                        <button type="button" aria-label="زيادة" disabled={item.quantity >= Math.min(20, Number(item.stock))} onClick={() => cart.changeQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button>
                      </div>
                      <button className="cart-page-remove" type="button" onClick={() => cart.changeQuantity(item.id, 0)}>
                        <Trash2 size={14} /> حذف
                      </button>
                    </div>
                  </div>
                  <strong className="cart-page-total">{formatMoney(item.salePrice * item.quantity)} {CURRENCY_LABEL}</strong>
                </li>
              ))}
            </ul>

            <aside className="cart-page-summary">
              <h2>ملخص الطلب</h2>
              <div><span>قيمة القطع</span><strong>{formatMoney(subtotal)} {CURRENCY_LABEL}</strong></div>
              <div><span>التوصيل</span><strong>{rate ? `من ${formatMoney(rate.price)} ${CURRENCY_LABEL}` : 'يتحدد معاك'}</strong></div>
              <div className="cart-grand-total"><span>الإجمالي التقديري</span><strong>{formatMoney(subtotal)} {CURRENCY_LABEL}</strong></div>
              <Link className="checkout-button buy-all-button" href="/checkout"><Zap size={17} /> اشترِ كل المنتجات</Link>
              {profile.whatsapp ? (
                <button className="checkout-button cart-whatsapp-order" type="button" onClick={() => setGateOpen(true)}>
                  <MessageCircle size={16} /> اطلب الكل على واتساب
                </button>
              ) : null}
              <Link className="button-dark" href="/products">كمّل التسوق</Link>
              <small className="cart-page-note"><Check size={13} /> بنسجّل بياناتك قبل ما نطلب من غيرها</small>
              <small className="cart-page-note"><PackageCheck size={13} /> بيتأكد المخزون عند تأكيد الطلب</small>
            </aside>
          </div>
        ) : (
          <div className="empty-catalog">
            <span className="empty-mark"><ShoppingBag size={20} /></span>
            <h3>السلة فاضية</h3>
            <p>ابدأ تصفح القطع واختار اللي يعجبك.</p>
            <Link className="button-dark" href="/products">تصفح المنتجات</Link>
          </div>
        )}
      </PageSection>

      <CustomerGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        reason="سجّل بياناتك الأول، وبعدها هنجهّز رسالة واحدة فيها كل منتجات الشنطة."
        onVerified={(customer) => {
          setGateOpen(false);
          buyAllViaWhatsApp(customer);
        }}
      />

      {profile.whatsapp ? (
        <PageSection>
          <div className="cart-page-help">
            <p>تحب تسأل قبل ما تطلب؟</p>
            <a className="button-dark" href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">اسألنا على واتساب</a>
          </div>
        </PageSection>
      ) : null}
    </StoreLayout>
  );
}