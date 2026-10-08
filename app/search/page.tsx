'use client';

import { useEffect, useMemo, useState } from 'react';
import CatalogBrowser from '@/components/catalog-browser';
import { PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { rankProducts } from '@/lib/store';

export default function SearchPage() {
  const { available, categories, brands, loading } = useStoreData();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
  }, []);

  const { items, tokens } = useMemo(
    () => rankProducts(available, query, query.trim() ? 'relevance' : 'featured', 'all', false),
    [available, query],
  );

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    return available
      .flatMap((product) => [product.categoryLabel, product.brandLabel].filter(Boolean))
      .filter((value): value is string => Boolean(value))
      .filter((value) => (seen.has(value) ? false : (seen.add(value), true)))
      .slice(0, 10);
  }, [available]);

  return (
    <StoreLayout searchEnabled searchValue={query} onSearchChange={setQuery} searchResults={query.trim() ? items.length : null}>
      <PageHero
        eyebrow="بحث"
        title={query.trim() ? `نتائج «${query.trim()}»` : 'ابحث في المتجر'}
        description={query.trim() ? `${items.length} نتيجة مطابقة` : 'اكتب اسم القطعة أو القسم أو كود المنتج.'}
        breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'البحث' }]}
      />

      {query.trim() ? (
        <PageSection>
          <CatalogBrowser
            products={items}
            loading={loading}
            categories={categories}
            brands={brands}
            initialQuery={query}
            pageSize={60}
            emptyTitle="مفيش نتائج"
            emptyBody="جرّب كلمة أقصر أو اسم قسم أو براند."
          />
          {tokens.length ? <p className="search-tokens-note">بحثنا في: {tokens.join(' + ')}</p> : null}
        </PageSection>
      ) : (
        <PageSection>
          <div className="search-suggestions">
            <span className="filter-label">اقتراحات سريعة</span>
            <div>
              {suggestions.map((value) => (
                <button key={value} className="sibling-chip" type="button" onClick={() => setQuery(value)}>{value}</button>
              ))}
            </div>
          </div>
        </PageSection>
      )}
    </StoreLayout>
  );
}