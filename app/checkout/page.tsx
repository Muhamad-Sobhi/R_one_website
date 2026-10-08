'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import CheckoutFlow, { readSavedDetails, type CheckoutForm } from '@/components/checkout-flow';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useCart, useStoreData } from '@/lib/hooks';
import { cartItemsFrom } from '@/components/checkout-flow';

const emptyForm: CheckoutForm = { customerName: '', phone: '', city: '', address: '', shippingArea: '' };

export default function CheckoutPage() {
  const { products, available, rates, profile } = useStoreData();
  const cart = useCart(products);
  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readSavedDetails();
    if (saved) setForm(saved);
    setReady(true);
  }, []);

  const items = useMemo(() => cartItemsFrom(available, cart.lines), [available, cart.lines]);

  return (
    <StoreLayout>
      <PageHero eyebrow="خطوة أخيرة" title="إتمام الطلب" description="الدفع عند الاستلام، والتأكيد بيتم على واتساب." breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'السلة', href: '/cart' }, { label: 'إتمام الطلب' }]} />

      <PageSection>
        {ready && !items.length ? (
          <div className="empty-catalog">
            <span className="empty-mark"><ShoppingBag size={20} /></span>
            <h3>السلة فاضية</h3>
            <p>ضيف قطعة واحدة على الأقل قبل ما تطلب.</p>
            <Link className="button-dark" href="/products">تصفح المنتجات</Link>
          </div>
        ) : (
          <CheckoutFlow
            items={items}
            rates={rates}
            whatsapp={profile.whatsapp}
            form={form}
            onFormChange={setForm}
            onSuccess={() => cart.clear()}
          />
        )}
      </PageSection>
    </StoreLayout>
  );
}