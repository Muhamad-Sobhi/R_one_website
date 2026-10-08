'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import CatalogBrowser from '@/components/catalog-browser';
import ProductCard from '@/components/product-card';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { formatMoney, todayStamp } from '@/lib/store';

export default function OffersPage() {
  const { available, categories, brands, offers, loading } = useStoreData();
  const today = todayStamp();

  const activeOffers = useMemo(
    () => offers.filter((offer) => offer.isActive && today >= offer.startsOn && today <= offer.endsOn),
    [offers, today],
  );

  const offerProducts = useMemo(
    () => available.filter((product) => activeOffers.some((offer) => offer.productIds?.includes(product.id))),
    [available, activeOffers],
  );

  const best = useMemo(
    () =>
      [...offerProducts]
        .map((product) => ({
          product,
          save: Math.round(((product.price - product.salePrice) / Math.max(1, product.price)) * 100),
        }))
        .filter((entry) => entry.save > 0)
        .sort((left, right) => right.save - left.save)
        .slice(0, 6),
    [offerProducts],
  );

  return (
    <StoreLayout>
      <PageHero
        eyebrow="عروض"
        title="العروض والخصومات"
        description="كل القطع اللي عليها عرض دلوقتي، مرتبة حسب أقوى خصم."
        breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'العروض' }]}
      />

      {activeOffers.length ? (
        <PageSection>
          <div className="offer-strip">
            {activeOffers.map((offer) => (
              <div className="offer-card" key={offer.id}>
                <span className="offer-card-icon"><Sparkles size={16} /></span>
                <div>
                  <strong>{offer.title}</strong>
                  <small>
                    {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `${formatMoney(offer.discountValue)}`} خصم
                    {' · '}ينتهي {offer.endsOn}
                  </small>
                </div>
                <Link href="/products">تسوّق الآن <ArrowLeft size={14} /></Link>
              </div>
            ))}
          </div>
        </PageSection>
      ) : null}

      {best.length ? (
        <div className="rail rail-tight">
          <div className="rail-head">
            <h2>أقوى الخصومات</h2>
            <Link className="link-underline" href="/products">كل المنتجات <ArrowLeft size={14} /></Link>
          </div>
          <div className="rail-track">
            {best.map((entry, index) => (
              <div className="rail-item" key={entry.product.id}>
                <span className="save-badge">-{entry.save}%</span>
                <ProductCard product={entry.product} index={index} priority={index < 4} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <PageSection>
        <CatalogBrowser
          products={available}
          loading={loading}
          categories={categories}
          brands={brands}
          initialOfferOnly
          emptyTitle="مفيش عروض شغالة دلوقتي"
          emptyBody="أول ما يبدأ عرض جديد هيبان هنا، تابعنا عشان يوصلك."
        />
      </PageSection>
    </StoreLayout>
  );
}