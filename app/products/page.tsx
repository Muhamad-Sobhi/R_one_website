'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CatalogBrowser from '@/components/catalog-browser';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { rankProducts } from '@/lib/store';

export default function ProductsPage() {
  const router = useRouter();
  const { available, categories, brands } = useStoreData();
  const [search, setSearch] = useState('');

  const results = useMemo(
    () => (search.trim() ? rankProducts(available, search, 'relevance', 'all', false).items.length : null),
    [available, search],
  );

  function update(value: string) {
    setSearch(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set('q', value.trim());
    else url.searchParams.delete('q');
    window.history.replaceState(null, '', url.toString());
  }

  return (
    <StoreLayout searchEnabled searchValue={search} onSearchChange={update} searchResults={results}>
      <PageHero
        eyebrow="المتجر"
        title="كل القطع"
        description="تصفح المجموعة كاملة، وفلتر حسب القسم أو البراند أو السعر."
        breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'كل المنتجات' }]}
      />
      <PageSection>
        <CatalogBrowser products={available} categories={categories} brands={brands} />
      </PageSection>
      {search.trim() ? (
        <button className="catalog-jump" type="button" onClick={() => router.push(`/search?q=${encodeURIComponent(search)}`)}>
          افتح صفحة البحث الكاملة
        </button>
      ) : null}
    </StoreLayout>
  );
}