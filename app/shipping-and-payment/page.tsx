'use client';

import { Banknote, CreditCard, PackageCheck, Truck } from 'lucide-react';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { CURRENCY_LABEL, formatMoney } from '@/lib/store';

export default function ShippingPage() {
  const { rates } = useStoreData();

  return (
    <StoreLayout>
      <PageHero eyebrow="الشحن والدفع" title="الشحن والتوصيل" description="كل Regions اللي بنشحنها، والتكلفة والمدة لكل منطقة." breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'الشحن والتوصيل' }]} />

      <PageSection>
        <div className="shipping-cards">
          <div className="shipping-card">
            <span><Truck size={18} /></span>
            <strong>توصيل لكل المحافظات</strong>
            <p>بنشحن لكل محافظات مصر، والمدة بتختلف حسب المنطقة وحالة الطلب.</p>
          </div>
          <div className="shipping-card">
            <span><Banknote size={18} /></span>
            <strong>الدفع عند الاستلام</strong>
            <p>تدفع لما تستلم الطلب، من غير أي مقدم.</p>
          </div>
          <div className="shipping-card">
            <span><PackageCheck size={18} /></span>
            <strong>تأكيد قبل الشحن</strong>
            <p>بنكلمك على واتساب نأكد الطلب والموقع قبل ما نجهز.</p>
          </div>
          <div className="shipping-card">
            <span><CreditCard size={18} /></span>
            <strong>استبدال خلال 14 يوم</strong>
            <p>لو القطعة مش مناسبة، استبدال أو استرجاع من غير تكلفة.</p>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="shipping-table-wrap">
          <h2>أسعار التوصيل</h2>
          {rates.length ? (
            <table className="shipping-table">
              <thead>
                <tr><th>المنطقة</th><th>التكلفة</th><th>المدة</th></tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id}>
                    <td>{rate.area}</td>
                    <td>{formatMoney(rate.price)} {CURRENCY_LABEL}</td>
                    <td>{rate.deliveryDays} أيام عمل</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted-text">أسعار الشحن بتتأكد معاك حسب منطقتك عند تأكيد الطلب.</p>
          )}
        </div>
      </PageSection>
    </StoreLayout>
  );
}
