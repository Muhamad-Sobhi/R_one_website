'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, Minus, PackageCheck, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { cartItemsFrom } from '@/components/checkout-flow';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useCart, useStoreData } from '@/lib/hooks';
import { CURRENCY_LABEL, formatMoney } from '@/lib/store';

export default function CartPage() {
  const { products, available, rates, profile } = useStoreData();
  const cart = useCart(products);
  const items = useMemo(() => cartItemsFrom(available, cart.lines), [available, cart.lines]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const rate = rates.find((entry) => entry.isActive);

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
              <Link className="checkout-button" href="/checkout">إتمام الطلب <ArrowLeft size={16} /></Link>
              <Link className="button-dark" href="/products">كمّل التسوق</Link>
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