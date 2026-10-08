'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import CatalogBrowser from '@/components/catalog-browser';
import ProductCard from '@/components/product-card';
import { NotFoundBlock, PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { pickFeatured } from '@/lib/store';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = typeof params?.id === 'string' ? params.id : '';
  const { available, categories, brands } = useStoreData();

  const category = categories.find((entry) => entry.id === categoryId) ?? null;
  const items = useMemo(
    () => available.filter((product) => product.categoryId === categoryId),
    [available, categoryId],
  );
  const siblings = useMemo(
    () => categories.filter((entry) => entry.id !== categoryId && available.some((product) => product.categoryId === entry.id)),
    [categories, available, categoryId],
  );
  const picks = useMemo(() => pickFeatured(items, 4), [items]);

  if (!category) {
    return (
      <StoreLayout>
        <NotFoundBlock title="القسم ده مش موجود" body="يمكن القسم اتشال أو الرابط اتغير." />
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <PageHero
        eyebrow="قسم"
        title={category.name}
        description={category.description || `${items.length} قطعة متاحة في القسم ده.`}
        breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'الأقسام', href: '/categories' }, { label: category.name }]}
      />

      {picks.length ? (
        <div className="rail rail-tight">
          <div className="rail-head">
            <h2>مختارات من {category.name}</h2>
          </div>
          <div className="rail-track">
            {picks.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} priority={index < 4} />
            ))}
          </div>
        </div>
      ) : null}

      <PageSection>
        <CatalogBrowser
          products={available}
          categories={categories}
          brands={brands}
          initialCategory={category.id}
          showCategoryFilter={false}
          emptyTitle="مفيش قطع في القسم ده"
          emptyBody="شوف الأقسام التانية أو استنى تشكيلة جديدة."
        />
      </PageSection>

      {siblings.length ? (
        <PageSection>
          <div className="sibling-categories">
            <span className="filter-label">أقسام تانية</span>
            <div>
              {siblings.map((entry) => (
                <a className="sibling-chip" href={`/categories/${entry.id}`} key={entry.id}>{entry.name}</a>
              ))}
            </div>
          </div>
        </PageSection>
      ) : null}
    </StoreLayout>
  );
}