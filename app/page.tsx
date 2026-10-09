'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  MapPin,
  PackageCheck,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Star,
  Tag,
  X,
} from 'lucide-react';
import BrandLogo from '@/components/brand-logo';
import CartDrawer from '@/components/cart-drawer';
import NewsletterForm from '@/components/newsletter-form';
import ProductCard from '@/components/product-card';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { useApprovedReviews, useCart, useOverlayLock, useStoreData, useToast } from '@/lib/hooks';
import { trackEvent, useTrackSearch } from '@/lib/analytics';
import type { CheckoutForm } from '@/components/checkout-flow';
import {
  MAIN_LINKS,
  type NavLink,
  type SavedCheckoutDetails,
  type SortKey,
  CURRENCY_LABEL,
  brandDescription,
  brandName,
  brandTagline,
  formatMoney,
  formatPrice,
  maxOrderQuantity,
  pickFeatured,
  rankProducts,
  tokenizeQuery,
  whatsappHref,
} from '@/lib/store';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'featured', label: 'ترتيب: المقترحة' },
  { value: 'relevance', label: 'ترتيب: الأنسب لبحثك' },
  { value: 'newest', label: 'ترتيب: الأحدث' },
  { value: 'price-low', label: 'السعر: الأقل أولاً' },
  { value: 'price-high', label: 'السعر: الأعلى أولاً' },
];

const CHECKOUT_KEY = 'r-one-checkout';

function readSavedDetails(): SavedCheckoutDetails | null {
  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${CHECKOUT_KEY}=`));
  if (!cookie) return null;
  try {
    const values = JSON.parse(decodeURIComponent(cookie.slice(CHECKOUT_KEY.length + 1))) as Record<string, unknown>;
    if (typeof values.customerName !== 'string' || typeof values.phone !== 'string') return null;
    return {
      customerName: values.customerName.slice(0, 100),
      phone: values.phone.slice(0, 30),
      city: typeof values.city === 'string' ? values.city.slice(0, 60) : '',
      address: typeof values.address === 'string' ? values.address.slice(0, 240) : '',
      shippingArea: typeof values.shippingArea === 'string' ? values.shippingArea.slice(0, 80) : '',
    };
  } catch {
    return null;
  }
}

function saveDetails(details: CheckoutForm) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CHECKOUT_KEY}=${encodeURIComponent(JSON.stringify(details))}; Max-Age=7776000; Path=/; SameSite=Lax${secure}`;
}

function clearDetails() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CHECKOUT_KEY}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

export default function StorePage() {
  const { products, available, categories, offers, rates, profile, loading, dataError, today } = useStoreData();
  const reviews = useApprovedReviews();
  const cart = useCart(products);
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortKey>('featured');
  const [offerOnly, setOfferOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderShippingPending, setOrderShippingPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [rememberDetails, setRememberDetails] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({ customerName: '', phone: '', city: '', address: '', shippingArea: '' });

  const deferredSearch = useDeferredValue(search);
  const name = brandName(profile.name);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('q');
    const pending = sessionStorage.getItem('r-one-search');
    sessionStorage.removeItem('r-one-search');
    const initial = (fromUrl ?? pending ?? '').trim();
    if (initial) {
      setSearch(initial);
      window.setTimeout(() => document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
    const saved = readSavedDetails();
    if (saved) {
      setForm((current: CheckoutForm) => ({ ...current, ...saved }));
      setRememberDetails(true);
    }
  }, []);

  useOverlayLock(checkoutOpen, () => {
    if (!busy) setCheckoutOpen(false);
  });

  const { items: ranked, tokens } = useMemo(
    () => rankProducts(available, deferredSearch, sortOrder, categoryFilter, offerOnly),
    [available, deferredSearch, sortOrder, categoryFilter, offerOnly],
  );

  useTrackSearch(deferredSearch, ranked.length, Boolean(deferredSearch.trim()));

  const featured = useMemo(() => pickFeatured(available, 2), [available]);
  const newest = useMemo(() => rankProducts(available, '', 'newest', 'all', false).items.slice(0, 8), [available]);
  const offersNow = useMemo(
    () => available.filter((product) => product.discounted).slice(0, 8),
    [available],
  );

  const categoryGroups = useMemo(
    () =>
      categories
        .map((category) => {
          const items = available.filter((product) => product.categoryId === category.id);
          return {
            ...category,
            count: items.length,
            cover: items.find((product) => product.image)?.image ?? '',
            items,
          };
        })
        .filter((group) => group.count > 0),
    [categories, available],
  );

  const menuCategories = useMemo(
    () => categoryGroups.map((group) => ({ id: group.id, name: group.name, count: group.count })),
    [categoryGroups],
  );

  const testimonials = useMemo(
    () => reviews.filter((review) => review.comment && Number(review.rating) >= 4).slice(0, 6),
    [reviews],
  );

  const rails = useMemo(
    () => categoryGroups.filter((group) => group.items.length >= 2).slice(0, 3),
    [categoryGroups],
  );

  const cartItems = useMemo(
    () =>
      cart.lines
        .map((line) => {
          const product = available.find((item) => item.id === line.productId);
          if (!product) return null;
          const quantity = Math.min(line.quantity, maxOrderQuantity(product, line.size));
          return quantity > 0 ? { ...product, quantity, size: line.size, color: line.color } : null;
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [cart.lines, available],
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const selectedRate = rates.find((rate) => rate.area === form.shippingArea);
  const shippingCost = selectedRate?.price || 0;
  const orderTotal = subtotal + shippingCost;

  const location = [profile.city, profile.governorate].filter(Boolean).join('، ');
  const locationFull = [profile.address, profile.city, profile.governorate].filter(Boolean).join('، ');
  const categoriesWithCounts = categoryGroups;

  function scrollToCollections() {
    document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set('q', value.trim());
    else url.searchParams.delete('q');
    window.history.replaceState(null, '', url.toString());
    if (!value.trim()) return;
    const section = document.getElementById('collections');
    if (!section) return;
    if (section.getBoundingClientRect().top > window.innerHeight - 140) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const removeToken = useCallback((token: string) => {
    setSearch((current) => tokenizeQuery(current).filter((entry) => entry !== token).join(' '));
  }, []);

  function handleAdd(product: { id: string; name: string }) {
    if (cart.addOne(product.id)) {
      trackEvent({ event: 'add_to_cart', productId: product.id, productName: product.name });
      showToast('اتضافت القطعة للشنطة.');
    } else {
      showToast('وصلت للحد المتاح من القطعة.');
    }
  }

  function beginCheckout() {
    trackEvent({ event: 'checkout_start' });
    setCheckoutError('');
    setOrderNumber('');
    setOrderShippingPending(false);
    setCheckoutOpen(true);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setCheckoutError('');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity, size: item.size, color: item.color })) }),
      });
      const result = (await response.json()) as { error?: string; orderId?: string; shippingPending?: boolean };
      if (!response.ok || !result.orderId) throw new Error(result.error || 'تعذر تسجيل الطلب.');
      if (rememberDetails) saveDetails(form);
      else clearDetails();
      setOrderNumber(result.orderId);
      setOrderShippingPending(result.shippingPending === true);
      cart.clear();
      setCheckoutOpen(false);
      setCartOpen(true);
    } catch (reason) {
      setCheckoutError(reason instanceof Error ? reason.message : 'تعذر تسجيل الطلب. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="store-shell">
      <SiteHeader
        profile={profile}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        links={MAIN_LINKS as NavLink[]}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchResults={deferredSearch.trim() ? ranked.length : null}
        categories={menuCategories}
      />

      <section className="intro-band" id="top">
        <div className="intro-copy">
          <span className="eyebrow"><i /> {name} · MADE TO MOVE</span>
          <h1>مصنوع للحركة.<br /><em>ومفصّل على مقاسك.</em></h1>
          <p>{brandDescription(profile.description)}</p>
          <div className="intro-cta-row">
            <Link className="intro-link" href="#collections">اكتشف المجموعة <ArrowDownLeft size={16} /></Link>
            <Link className="intro-ghost-link" href="/products">كل المنتجات <ArrowDownLeft size={15} /></Link>
          </div>
        </div>

        <div className="intro-products" aria-label="اختيارات من المجموعة">
          {featured.length ? (
            featured.map((product, index) => (
              <article className={`intro-product-card intro-product-card-${index + 1}`} key={product.id}>
                <Link className="intro-product-media" href={`/product/${product.id}`} aria-label={`عرض ${product.name}`}>
                  {product.image ? <Image src={product.image} alt={product.name} fill sizes="240px" className="intro-product-img" /> : <div className="product-placeholder"><span>R/</span><b>ONE</b></div>}
                  <span className="intro-product-index">R/ 0{index + 1}</span>
                  {product.discounted ? <span className="intro-product-sale">عرض</span> : null}
                </Link>
                <div className="intro-product-info">
                  <div className="intro-product-copy">
                    <span>{product.categoryLabel}</span>
                    <strong>{product.name}</strong>
                  </div>
                  <div className="intro-product-buy">
                    <span>
                      {formatMoney(product.salePrice)}
                      {product.discounted ? <del>{formatMoney(product.price)}</del> : null}
                    </span>
                    <button type="button" title={`أضف ${product.name} للشنطة`} aria-label={`أضف ${product.name} للشنطة`} onClick={() => handleAdd(product)}>
                      <ShoppingBag size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="intro-products-empty">
              <BrandLogo size={54} variant="ghost" />
              <small>اختيارات من المجموعة هتظهر هنا فور ما تنزل القطع.</small>
            </div>
          )}
        </div>
      </section>

      <div className="service-strip" aria-label="مزايا التسوق">
        <span><Tag size={16} /> قطع مختارة</span>
        <i />
        <span><MapPin size={16} /> توصيل لكل مصر</span>
        <i />
        <span><Clock3 size={16} /> متابعة مباشرة للطلب</span>
        <i />
        <span className="strip-location">{location || name}</span>
      </div>

      {newest.length ? (
        <section className="rail-section">
          <div className="rail-head">
            <div>
              <span className="eyebrow">وصل حديثاً</span>
              <h2>أحدث القطع</h2>
            </div>
            <Link className="link-underline" href="/products">عرض المزيد <ArrowLeft size={14} /></Link>
          </div>
          <div className="rail-track">
            {newest.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} onAdd={handleAdd} priority={index < 4} />
            ))}
          </div>
        </section>
      ) : null}

      {categoryGroups.length ? (
        <section className="section-shell category-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">أقسامنا</span>
              <h2>اختار القسم اللي عاجبك</h2>
            </div>
            <Link className="link-underline" href="/categories">كل الأقسام <ArrowLeft size={14} /></Link>
          </div>
          <div className="category-grid">
            {categoryGroups.slice(0, 6).map((group) => (
              <Link className="category-card" href={`/categories/${group.id}`} key={group.id}>
                <div className="category-card-media">
                  {group.cover ? <Image src={group.cover} alt={group.name} fill sizes="(max-width: 700px) 100vw, 33vw" /> : <div className="product-placeholder"><span>R/</span><b>ONE</b></div>}
                  <span className="category-card-count">{group.count} قطعة</span>
                </div>
                <div className="category-card-copy">
                  <div>
                    <h3>{group.name}</h3>
                    {group.description ? <p>{group.description}</p> : null}
                  </div>
                  <span className="category-card-link">تصفح <ArrowLeft size={15} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="collection-section" id="collections">
        <div className="collection-heading">
          <div>
            <span className="eyebrow">المجموعة الحالية <i /></span>
            <h2>اختار قطعتك</h2>
            <p>قطع مختارة تتحرك معاك، كل يوم.</p>
          </div>
          <div className="collection-count">
            <strong>{ranked.length.toString().padStart(2, '0')}</strong>
            <span>{deferredSearch.trim() ? 'نتيجة لبحثك' : 'قطعة متاحة'}</span>
          </div>
        </div>

        {deferredSearch.trim() ? (
          <div className="search-summary" role="status">
            <Search size={15} />
            <span>نتائج البحث عن</span>
            {tokens.map((token) => (
              <button className="search-chip" key={token} type="button" onClick={() => removeToken(token)}>
                {token} <X size={12} />
              </button>
            ))}
            <span>· <b>{ranked.length}</b> قطعة</span>
            <button className="link-plain" type="button" onClick={() => setSearch('')}>مسح البحث</button>
          </div>
        ) : null}

        <div className="catalog-controls">
          <div className="category-tabs" role="group" aria-label="تصفية حسب النوع">
            <button className={categoryFilter === 'all' ? 'category-active' : ''} onClick={() => setCategoryFilter('all')}>
              الكل <span>{available.length}</span>
            </button>
            {categoriesWithCounts.map((category) => (
              <button key={category.id} className={categoryFilter === category.id ? 'category-active' : ''} onClick={() => setCategoryFilter(category.id)}>
                {category.name} <span>{category.count}</span>
              </button>
            ))}
          </div>
          <div className="catalog-filters">
            <button className={`offer-filter ${offerOnly ? 'offer-filter-active' : ''}`} onClick={() => setOfferOnly((current) => !current)}>
              <span /> عليه عرض
            </button>
            <label className="sort-select">
              <select aria-label="ترتيب المنتجات" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortKey)}>
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
        </div>

        {dataError ? <div className="store-notice" role="alert"><CircleHelp size={16} /><span>{dataError}</span></div> : null}

        {loading ? (
          <div className="loading-products" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="skeleton-card" key={index}>
                <div className="skeleton-media" />
                <div className="skeleton-line tiny" />
                <div className="skeleton-line short" />
              </div>
            ))}
          </div>
        ) : ranked.length ? (
          <div className="product-grid">
            {ranked.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} tokens={tokens} onAdd={handleAdd} priority={index < 4} />
            ))}
          </div>
        ) : (
          <div className="empty-catalog">
            <span className="empty-mark">R/</span>
            <h3>{dataError ? 'الكتالوج مش متاح دلوقتي' : 'مفيش قطع مطابقة'}</h3>
            <p>{dataError ? 'تأكد من إعدادات Firebase وقواعد Firestore، وبعدها حدّث الصفحة.' : 'جرّب كلمة تانية أو شوف كل القطع من غير فلترة.'}</p>
            <Link className="button-dark" href="/products">عرض كل القطع <ArrowLeft size={15} /></Link>
          </div>
        )}
      </section>

      {offersNow.length ? (
        <section className="section-shell rail-section rail-section-alt">
          <div className="rail-head">
            <div>
              <span className="eyebrow">عروض دلوقتي</span>
              <h2>قطع عليها خصم</h2>
            </div>
            <Link className="link-underline" href="/offers">كل العروض <ArrowLeft size={14} /></Link>
          </div>
          <div className="rail-track">
            {offersNow.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} onAdd={handleAdd} />
            ))}
          </div>
        </section>
      ) : null}

      {rails.map((group) => (
        <section className="rail-section" key={group.id}>
          <div className="rail-head">
            <div>
              <span className="eyebrow">قسم</span>
              <h2>{group.name}</h2>
            </div>
            <Link className="link-underline" href={`/categories/${group.id}`}>عرض القسم <ArrowLeft size={14} /></Link>
          </div>
          <div className="rail-track">
            {group.items.slice(0, 8).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} onAdd={handleAdd} />
            ))}
          </div>
        </section>
      ))}

      {testimonials.length ? (
        <section className="section-shell testimonials-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">آراء العملاء</span>
              <h2>اللي قالوه عنّا</h2>
            </div>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((review) => (
              <figure className="testimonial" key={review.id}>
                <span className="testimonial-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={13} className={star <= Number(review.rating) ? 'star-on' : 'star-off'} fill={star <= Number(review.rating) ? 'currentColor' : 'none'} />
                  ))}
                </span>
                <blockquote>{review.comment}</blockquote>
                <figcaption>{review.customerName}{review.productName ? ` · ${review.productName}` : ''}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="story-band" id="story">
        <div className="story-mark">R/01 <i /></div>
        <div className="story-story">
          <span className="eyebrow">ليه {name}؟</span>
          <h2>اختار القطعة<br /><em>اللي بتليق بيك.</em></h2>
          <p className="story-tagline">{brandTagline(profile.tagline)}</p>
          <p>{brandDescription(profile.description)}</p>
        </div>
        <div className="story-details">
          <span><MapPin size={15} /> {locationFull || 'القاهرة، مصر'}</span>
          {profile.workingHours ? <span><Clock3 size={15} /> {profile.workingHours}</span> : null}
          <Link href="/about">تعرف علينا <ArrowUpLeft size={15} /></Link>
        </div>
      </section>

      <section className="section-shell">
        <NewsletterForm />
      </section>

      <SiteFooter profile={profile} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        brand={name}
        count={cartCount}
        subtotal={subtotal}
        total={orderTotal}
        onQuantity={cart.changeQuantity}
        onBrowse={() => {
          setCartOpen(false);
          window.setTimeout(() => window.location.assign('/cart'), 120);
        }}
        shipping={<div><span>التوصيل</span><strong>{selectedRate ? formatPrice(shippingCost) : 'يُحدد عند الدفع'}</strong></div>}
        onBuyAll={beginCheckout}
        actions={<button className="checkout-button" type="button" onClick={beginCheckout}>أكمل بيانات التوصيل <ArrowLeft size={17} /></button>}
      >
        {orderNumber ? (
          <div className="order-success">
            <span><Check size={22} /></span>
            <small>تم تأكيد طلبك</small>
            <h3>طلبك اتسجّل بنجاح</h3>
            <p>رقم الطلب</p>
            <strong dir="ltr">#{orderNumber.slice(-6).toUpperCase()}</strong>
            {orderShippingPending ? (
              <p style={{ marginTop: 10 }}>
                <a className="link-underline" href={whatsappHref(profile.whatsapp, `مرحباً، أريد تأكيد تكلفة الشحن لطلبي رقم ${orderNumber}.`)} target="_blank" rel="noreferrer">
                  أكد الشحن على واتساب <ArrowUpLeft size={13} />
                </a>
              </p>
            ) : null}
            <button className="button-dark" onClick={() => { setOrderNumber(''); setCartOpen(false); window.setTimeout(scrollToCollections, 120); }}>
              كمّل التصفح <ArrowLeft size={16} />
            </button>
          </div>
        ) : null}
      </CartDrawer>

      {checkoutOpen ? (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setCheckoutOpen(false); }}>
          <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">خطوة أخيرة</span>
                <h2 id="checkout-title">بيانات التوصيل</h2>
              </div>
              <button className="icon-button" type="button" title="إغلاق" aria-label="إغلاق" onClick={() => setCheckoutOpen(false)}>
                <X size={19} />
              </button>
            </div>

            <form className="checkout-form" onSubmit={submitOrder}>
              <div className="checkout-order-summary" aria-label="المنتجات في الطلب">
                {cartItems.map((item) => (
                  <div key={item.id}>
                    <span>
                      {item.name}
                      {[item.color, item.size].filter(Boolean).length ? <em className="item-options">{[item.color, item.size].filter(Boolean).join(' · ')}</em> : null}
                      <small>× {item.quantity}</small>
                    </span>
                    <strong>{formatMoney(item.salePrice * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              <label>
                الاسم بالكامل
                <input autoComplete="name" required maxLength={100} value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} placeholder="اكتب اسمك" />
              </label>
              <label>
                رقم الموبايل
                <input autoComplete="tel" type="tel" dir="ltr" required minLength={8} maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01xxxxxxxxx" />
              </label>

              <div className="checkout-two">
                <label>
                  المحافظة / منطقة التوصيل
                  <input
                    autoComplete="address-level1"
                    list="r-one-shipping-areas"
                    required
                    maxLength={80}
                    value={form.shippingArea}
                    onChange={(event) => setForm({ ...form, shippingArea: event.target.value, city: form.city || event.target.value })}
                    placeholder="اكتب المحافظة أو المنطقة"
                  />
                  <datalist id="r-one-shipping-areas">
                    {rates.map((rate) => (
                      <option key={rate.id} value={rate.area} label={`${formatPrice(rate.price)} · ${rate.deliveryDays} أيام`} />
                    ))}
                  </datalist>
                  <small className="shipping-field-hint">
                    {selectedRate ? `الشحن ${formatPrice(selectedRate.price)} · ${selectedRate.deliveryDays} أيام عمل` : 'اكتب منطقتك وهنأكد تكلفة الشحن معاك.'}
                  </small>
                </label>
                <label>
                  المدينة / المركز
                  <input autoComplete="address-level2" required maxLength={60} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="المدينة أو المركز" />
                </label>
              </div>

              <label>
                العنوان بالتفصيل
                <input autoComplete="street-address" required minLength={6} maxLength={240} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="الشارع، رقم العمارة، الدور، علامة مميزة" />
              </label>

              <div className="remember-details">
                <label className="remember-details-toggle">
                  <input
                    type="checkbox"
                    checked={rememberDetails}
                    onChange={(event) => {
                      setRememberDetails(event.target.checked);
                      if (!event.target.checked) clearDetails();
                    }}
                  />
                  <span>احفظ بياناتي على هذا الجهاز</span>
                </label>
                <small>اختياري · لمدة 90 يومًا، ويمكنك إلغاء الاختيار في أي وقت.</small>
              </div>

              {selectedRate ? (
                <div className="delivery-estimate">
                  <PackageCheck size={16} />
                  <span>التوصيل إلى {selectedRate.area}</span>
                  <strong>{formatPrice(shippingCost)}</strong>
                  <small>{selectedRate.deliveryDays} أيام عمل</small>
                </div>
              ) : (
                <div className="delivery-pending-note">
                  <PackageCheck size={16} />
                  <span>هنأكد تكلفة وموعد التوصيل قبل تجهيز الطلب.</span>
                </div>
              )}

              {checkoutError ? <p className="checkout-error" role="alert">{checkoutError}</p> : null}

              <div className="checkout-total">
                <span>{selectedRate ? 'الإجمالي شامل التوصيل' : 'قيمة المنتجات قبل تأكيد الشحن'}</span>
                <strong>{formatPrice(orderTotal)}</strong>
              </div>

              <button className="checkout-button" type="submit" disabled={busy || !cartItems.length}>
                {busy ? 'جارٍ تأكيد الطلب...' : <>أكد الطلب <ArrowLeft size={17} /></>}
              </button>
              <p className="checkout-note">دفع عند الاستلام · {CURRENCY_LABEL}</p>
            </form>
          </section>
        </div>
      ) : null}

      {profile.whatsapp ? (
        <a
          onClick={() => trackEvent({ event: 'whatsapp' })}
          className={`whatsapp-float ${orderNumber && orderShippingPending ? 'whatsapp-order-followup' : ''}`}
          href={whatsappHref(profile.whatsapp, orderNumber && orderShippingPending ? `مرحباً، أريد تأكيد تكلفة الشحن لطلبي رقم ${orderNumber}.` : `مرحباً، عندي استفسار عن منتجات ${name}.`)}
          target="_blank"
          rel="noreferrer"
          aria-label="تواصل معنا على واتساب"
        >
          <Send size={17} />
          <span>استفسار واتساب</span>
        </a>
      ) : null}

      {toast ? <div className="store-toast" role="status"><span><Check size={14} /></span>{toast}</div> : null}
    </main>
  );
}