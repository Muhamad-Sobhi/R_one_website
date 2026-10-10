'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, PackageCheck, Sparkles, Truck } from 'lucide-react';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { brandDescription, brandTagline } from '@/lib/store';

export default function AboutPage() {
  const { profile, available } = useStoreData();
  const location = [profile.city, profile.governorate].filter(Boolean).join('، ');
  const highlights = [
    { icon: Sparkles, title: 'اختيار دقيق', body: 'كل قطعة بتتمشي معاك في يومك، مش بتتغير.' },
    { icon: PackageCheck, title: 'مخزون متجدد', body: 'بتحدث الكميات باستمرار عشان ما تطلبش حاجة خلصت.' },
    { icon: Truck, title: 'توصيل لكل المحافظات', body: 'من تاريخ الطلب لحد بابك، والمتابعة لحظة بلحظة.' },
    { icon: MapPin, title: 'من قلب مصر', body: `${location || 'القاهرة، مصر'} ·Piece by piece`.replace('Piece by piece', 'قطعة بقطعة') },
  ];

  return (
    <StoreLayout>
      <PageHero eyebrow="عن R/ONE" title="تفاصيل معمولة علشان تعيش" description={brandDescription(profile.description)} breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'عن R/ONE' }]} />

      <PageSection>
        <div className="about-story">
          <div className="about-story-media">
            {available.find((product) => product.image)?.image ? (
              <Image src={available.find((product) => product.image)!.image} alt="R/ONE" fill sizes="(max-width: 900px) 92vw, 38vw" priority />
            ) : (
              <div className="product-placeholder"><span>R/</span><b>ONE</b></div>
            )}
          </div>
          <div className="about-story-copy">
            <span className="eyebrow">القصة</span>
            <h2>{brandTagline(profile.tagline)}</h2>
            <p>{brandDescription(profile.description)}</p>
            <p>
              R/ONE متجر متخصص في بيع القطع الشبابية، بنختار كل قطعة بعناية وبنشرحها بوضوح قبل ما تطلبها.
              هدفنا إن تجربتك تكون سهلة من أول ضغطة لحد ما توصل القطعة لبابك.
            </p>
            <div className="about-stats">
              <div><strong>{available.length}</strong><span>قطعة متاحة</span></div>
              <div><strong>{new Set(available.map((product) => product.categoryLabel)).size}</strong><span>قسم</span></div>
              <div><strong>14</strong><span>يوم استبدال</span></div>
            </div>
            <Link className="button-dark" href="/products">ابدأ التسوق <ArrowLeft size={16} /></Link>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="about-highlights">
          {highlights.map((item) => (
            <div className="about-highlight" key={item.title}>
              <span><item.icon size={18} /></span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </PageSection>
    </StoreLayout>
  );
}
