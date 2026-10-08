'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { formatMoney } from '@/lib/store';

export default function CategoriesPage() {
  const { available, categories } = useStoreData();

  const groups = categories
    .map((category) => {
      const items = available.filter((product) => product.categoryId === category.id);
      return {
        ...category,
        items,
        count: items.length,
        from: items.length ? Math.min(...items.map((product) => product.salePrice || product.price)) : 0,
        cover: items.find((product) => product.image)?.image ?? '',
      };
    })
    .filter((group) => group.count > 0);

  return (
    <StoreLayout>
      <PageHero
        eyebrow="الأقسام"
        title="اختار القسم"
        description="كل قسم بيجمع قطع شبهه، عشان تلاقي اللي بتدور عليه بسرعة."
        breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'الأقسام' }]}
      />

      <PageSection>
        {groups.length ? (
          <div className="category-grid">
            {groups.map((group) => (
              <Link className="category-card" href={`/categories/${group.id}`} key={group.id}>
                <div className="category-card-media">
                  {group.cover ? <Image src={group.cover} alt={group.name} fill sizes="(max-width: 700px) 100vw, 33vw" /> : <div className="product-placeholder"><span>R/</span><b>ONE</b></div>}
                  <span className="category-card-count">{group.count} قطعة</span>
                </div>
                <div className="category-card-copy">
                  <div>
                    <h2>{group.name}</h2>
                    {group.description ? <p>{group.description}</p> : null}
                  </div>
                  <span className="category-card-link">
                    {group.from ? `من ${formatMoney(group.from)}` : 'تصفح'} <ArrowLeft size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-catalog">
            <span className="empty-mark">R/</span>
            <h3>لسه مفيش أقسام</h3>
            <p>ضيف أقسام من لوحة التحكم، وهتظهر هنا تلقائي.</p>
          </div>
        )}
      </PageSection>
    </StoreLayout>
  );
}