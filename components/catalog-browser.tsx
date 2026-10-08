'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, LayoutGrid, Rows3, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/product-card';
import {
  type CatalogEntry,
  type ResolvedProduct,
  type SortKey,
  formatMoney,
  rankProducts,
  stockState,
  tokenizeQuery,
} from '@/lib/store';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'featured', label: 'المقترحة' },
  { value: 'relevance', label: 'الأنسب' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'price-low', label: 'السعر: الأقل' },
  { value: 'price-high', label: 'السعر: الأعلى' },
  { value: 'name', label: 'الاسم' },
];

type CatalogBrowserProps = {
  products: ResolvedProduct[];
  categories: CatalogEntry[];
  brands: CatalogEntry[];
  initialCategory?: string;
  initialQuery?: string;
  initialOfferOnly?: boolean;
  showCategoryFilter?: boolean;
  showBrandFilter?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  pageSize?: number;
};

export default function CatalogBrowser({
  products,
  categories,
  brands,
  initialCategory = 'all',
  initialQuery = '',
  initialOfferOnly = false,
  showCategoryFilter = true,
  showBrandFilter = true,
  emptyTitle = 'مفيش قطع مطابقة',
  emptyBody = 'جرّب تغيّر الفلترة أو ابحث بكلمة تانية.',
  pageSize = 24,
}: CatalogBrowserProps) {
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState('all');
  const [sort, setSort] = useState<SortKey>(initialQuery ? 'relevance' : 'featured');
  const [offerOnly, setOfferOnly] = useState(initialOfferOnly);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [visible, setVisible] = useState(pageSize);
  const [grid, setGrid] = useState<'grid' | 'rows'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const priceCeiling = useMemo(
    () => Math.max(1, Math.ceil(Math.max(...products.map((product) => product.salePrice || product.price), 1) / 50) * 50),
    [products],
  );

  useEffect(() => {
    setCategory(initialCategory);
    setVisible(pageSize);
  }, [initialCategory, pageSize]);

  useEffect(() => {
    setVisible(pageSize);
  }, [sort, offerOnly, inStockOnly, maxPrice, brand, initialQuery, pageSize]);

  const tokens = useMemo(() => tokenizeQuery(initialQuery), [initialQuery]);

  const filtered = useMemo(() => {
    const { items } = rankProducts(products, initialQuery, sort, category, offerOnly);
    const byPrice = maxPrice ? items.filter((product) => product.salePrice <= maxPrice) : items;
    const byBrand = brand === 'all' ? byPrice : byPrice.filter((product) => product.brandLabel === brand || product.brandId === brand);
    return inStockOnly ? byBrand.filter((product) => stockState(product.stock).available) : byBrand;
  }, [products, initialQuery, sort, category, offerOnly, maxPrice, brand, inStockOnly]);

  const activeTokens = tokens;

  const shown = filtered.slice(0, visible);
  const activeFilterCount =
    (category !== 'all' ? 1 : 0) + (brand !== 'all' ? 1 : 0) + (offerOnly ? 1 : 0) + (inStockOnly ? 1 : 0) + (maxPrice ? 1 : 0);

  function reset() {
    setCategory('all');
    setBrand('all');
    setOfferOnly(false);
    setInStockOnly(false);
    setMaxPrice(0);
  }

  return (
    <div className="catalog-browser">
      <div className="catalog-toolbar">
        <div className="catalog-toolbar-row">
          <button className="filter-toggle" type="button" onClick={() => setFiltersOpen((open) => !open)}>
            <SlidersHorizontal size={16} /> الفلاتر {activeFilterCount ? <i>{activeFilterCount}</i> : null}
          </button>

          <label className="sort-select sort-select-wide">
            <select aria-label="ترتيب المنتجات" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} disabled={option.value === 'relevance' && !initialQuery.trim()}>
                  ترتيب: {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>

          <div className="view-toggle" role="group" aria-label="طريقة العرض">
            <button className={grid === 'grid' ? 'view-active' : ''} type="button" onClick={() => setGrid('grid')} aria-label="شبكة">
              <LayoutGrid size={16} />
            </button>
            <button className={grid === 'rows' ? 'view-active' : ''} type="button" onClick={() => setGrid('rows')} aria-label="صفوف">
              <Rows3 size={16} />
            </button>
          </div>
        </div>

        <aside className={`catalog-filters-panel ${filtersOpen ? 'catalog-filters-open' : ''}`} aria-label="فلترة المنتجات">
          <div className="filter-group">
            <span className="filter-label">التصنيف</span>
            <div className="filter-options">
              <button className={category === 'all' ? 'filter-active' : ''} type="button" onClick={() => setCategory('all')}>
                الكل <small>{products.length}</small>
              </button>
              {categories.map((entry) => (
                <button
                  key={entry.id}
                  className={category === entry.id ? 'filter-active' : ''}
                  type="button"
                  onClick={() => setCategory(entry.id)}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          </div>

          {showBrandFilter && brands.length ? (
            <div className="filter-group">
              <span className="filter-label">البراند</span>
              <div className="filter-options">
                <button className={brand === 'all' ? 'filter-active' : ''} type="button" onClick={() => setBrand('all')}>الكل</button>
                {brands.map((entry) => (
                  <button key={entry.id} className={brand === entry.id ? 'filter-active' : ''} type="button" onClick={() => setBrand(entry.id)}>
                    {entry.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="filter-group">
            <span className="filter-label">السعر حتى <b>{maxPrice ? formatMoney(maxPrice) : formatMoney(priceCeiling)}</b></span>
            <input
              className="price-range"
              type="range"
              min={0}
              max={priceCeiling}
              step={25}
              value={maxPrice || priceCeiling}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              aria-label="أقصى سعر"
            />
            <div className="price-range-ends"><small>0</small><small>{formatMoney(priceCeiling)}</small></div>
          </div>

          <div className="filter-group">
            <span className="filter-label">خيارات</span>
            <label className="filter-check">
              <input type="checkbox" checked={offerOnly} onChange={(event) => setOfferOnly(event.target.checked)} />
              <span>عليها عرض</span>
            </label>
            <label className="filter-check">
              <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} />
              <span>متوفر دلوقتي</span>
            </label>
          </div>

          {activeFilterCount ? (
            <button className="filter-reset" type="button" onClick={reset}>
              <X size={14} /> مسح الفلاتر
            </button>
          ) : null}
        </aside>

        <div className="catalog-result-line">
          <span>
            <b>{filtered.length}</b> قطعة
            {initialQuery.trim() ? <> لبحثك عن <strong>{initialQuery.trim()}</strong></> : null}
          </span>
          {activeTokens.length ? (
            <span className="catalog-tokens">{activeTokens.map((token) => <i key={token}>{token}</i>)}</span>
          ) : null}
        </div>
      </div>

      {shown.length ? (
        <>
          <div className={grid === 'rows' ? 'product-grid product-rows' : 'product-grid'} data-view={grid}>
            {shown.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                tokens={activeTokens}
                priority={index < 4}
                wide={grid === 'rows'}
              />
            ))}
          </div>
          {visible < filtered.length ? (
            <button className="load-more" type="button" onClick={() => setVisible((current) => current + pageSize)}>
              عرض المزيد ({filtered.length - visible} باقي)
            </button>
          ) : (
            <p className="catalog-end">وصلت لآخر قطعة · {filtered.length} معروضة</p>
          )}
        </>
      ) : (
        <div className="empty-catalog">
          <span className="empty-mark">R/</span>
          <h3>{emptyTitle}</h3>
          <p>{emptyBody}</p>
          <button type="button" onClick={reset}>مسح الفلاتر</button>
        </div>
      )}

      {filtered.length ? (
        <div className="catalog-quick-links">
          <span>روابط سريعة</span>
          <Link href="/products">كل المنتجات</Link>
          <Link href="/offers">العروض</Link>
          <Link href="/categories">الأقسام</Link>
          <Link href="/track-order">تتبع طلبك</Link>
        </div>
      ) : null}
    </div>
  );
}

function activeTokensSafe(items: ResolvedProduct[], tokens: string[]) {
  return tokens;
}