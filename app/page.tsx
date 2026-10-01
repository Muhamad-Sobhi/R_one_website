'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Instagram,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  Send,
  ShoppingBag,
  X,
} from 'lucide-react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

type ProductImage = { url?: string; publicId?: string };
type Product = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
  brandId?: string;
  price: number;
  salePrice?: number;
  offerTitle?: string;
  images?: ProductImage[];
  imageUrl?: string;
  stock: number;
};
type CatalogEntry = { id: string; name: string; isActive?: boolean };
type Offer = {
  id: string;
  title: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  productIds: string[];
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};
type ShippingRate = { id: string; area: string; price: number; deliveryDays: number; isActive: boolean };
type WorkshopProfile = {
  name: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  governorate: string;
  workingHours: string;
  instagram: string;
};
type CartLine = { productId: string; quantity: number };
type SavedCheckoutDetails = { customerName: string; phone: string; city: string; address: string; shippingArea: string };

const profileDefaults: WorkshopProfile = {
  name: 'ورشة R/ONE', description: 'ورشة متخصصة في تصنيع الملابس الشبابية.', phone: '', whatsapp: '', email: '',
  address: '', city: 'طوخ', governorate: 'القليوبية', workingHours: '', instagram: '',
};
const money = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });
const checkoutCookieName = 'r-one-checkout';

function readCheckoutCookie(): SavedCheckoutDetails | null {
  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${checkoutCookieName}=`));
  if (!cookie) return null;
  try {
    const values = JSON.parse(decodeURIComponent(cookie.slice(checkoutCookieName.length + 1))) as Record<string, unknown>;
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

function saveCheckoutCookie(details: SavedCheckoutDetails) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${checkoutCookieName}=${encodeURIComponent(JSON.stringify(details))}; Max-Age=7776000; Path=/; SameSite=Lax${secure}`;
}

function clearCheckoutCookie() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${checkoutCookieName}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

function productImage(product: Product) {
  return product.images?.find((image) => image.url)?.url || product.imageUrl || '';
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ar');
}

function currentPrice(product: Product, offers: Offer[], today: string) {
  const base = Number(product.price) || 0;
  const candidates = Number(product.salePrice) > 0 && Number(product.salePrice) < base ? [Number(product.salePrice)] : [];
  for (const offer of offers) {
    if (!offer.isActive || !offer.productIds?.includes(product.id) || today < offer.startsOn || today > offer.endsOn) continue;
    const discount = Number(offer.discountValue) || 0;
    const amount = offer.discountType === 'percentage' ? base * (1 - discount / 100) : base - discount;
    if (amount > 0 && amount < base) candidates.push(amount);
  }
  return Math.round(Math.min(base, ...candidates) * 100) / 100;
}

function whatsappHref(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, '');
  const international = digits.startsWith('00') ? digits.slice(2) : digits.startsWith('0') ? `20${digits.slice(1)}` : digits;
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${international}${query}`;
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogEntry[]>([]);
  const [brands, setBrands] = useState<CatalogEntry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [profile, setProfile] = useState<WorkshopProfile>(profileDefaults);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('featured');
  const [offerOnly, setOfferOnly] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [directOrderItem, setDirectOrderItem] = useState<CartLine | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderShippingPending, setOrderShippingPending] = useState(false);
  const [rememberCheckoutDetails, setRememberCheckoutDetails] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', email: '', city: '', address: '', shippingArea: '' });
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const handlePublicReadError = () => setDataError('تعذر تحميل بيانات المتجر. تأكد من نشر قواعد Firebase العامة.');
    const cleanups = [
      onSnapshot(collection(db, 'products'), (snapshot) => {
        setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Product));
        setLoading(false);
      }, () => { setDataError('تعذر تحميل المنتجات. تأكد من نشر قواعد Firebase العامة.'); setLoading(false); }),
      onSnapshot(collection(db, 'categories'), (snapshot) => setCategories(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CatalogEntry).filter((item) => item.isActive !== false)), handlePublicReadError),
      onSnapshot(collection(db, 'brands'), (snapshot) => setBrands(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CatalogEntry).filter((item) => item.isActive !== false)), handlePublicReadError),
      onSnapshot(collection(db, 'offers'), (snapshot) => setOffers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Offer)), handlePublicReadError),
      onSnapshot(collection(db, 'shippingRates'), (snapshot) => setRates(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ShippingRate).filter((item) => item.isActive !== false)), handlePublicReadError),
      onSnapshot(doc(db, 'workshopSettings', 'main'), (snapshot) => setProfile({ ...profileDefaults, ...(snapshot.exists() ? snapshot.data() : {}) }), handlePublicReadError),
    ];
    return () => cleanups.forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('r-one-cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as CartLine[];
        if (Array.isArray(parsed)) setCart(parsed.filter((line) => line && typeof line.productId === 'string' && Number.isInteger(line.quantity) && line.quantity > 0));
      }
    } catch {
      localStorage.removeItem('r-one-cart');
    }
    const savedDetails = readCheckoutCookie();
    if (savedDetails) {
      setForm((current) => ({ ...current, ...savedDetails }));
      setRememberCheckoutDetails(true);
    }
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (cartReady) localStorage.setItem('r-one-cart', JSON.stringify(cart));
  }, [cart, cartReady]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.style.overflow = cartOpen || activeProduct ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen, activeProduct]);

  const availableProducts = products.filter((product) => Number(product.stock) > 0);
  const resolvedProducts = availableProducts.map((product) => {
    const activeOffers = offers.filter((offer) => offer.isActive && offer.productIds?.includes(product.id) && today >= offer.startsOn && today <= offer.endsOn);
    const discount = activeOffers.sort((left, right) => (left.discountValue || 0) - (right.discountValue || 0))[0];
    return { ...product, salePrice: currentPrice(product, offers, today), offerTitle: discount?.title || product.offerTitle };
  });
  const filteredProducts = useMemo(() => {
    const term = normalize(search);
    const filtered = resolvedProducts.filter((product) => {
      const category = categories.find((entry) => entry.id === product.categoryId)?.name || product.category || '';
      const brand = brands.find((entry) => entry.id === product.brandId)?.name || product.brand || '';
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter || category === categories.find((entry) => entry.id === categoryFilter)?.name;
      const matchesTerm = !term || [product.name, product.sku || '', category, brand].some((value) => normalize(value).includes(term));
      const hasDiscount = product.salePrice < Number(product.price);
      return matchesCategory && matchesTerm && (!offerOnly || hasDiscount);
    });
    if (sortOrder === 'price-low') filtered.sort((left, right) => left.salePrice - right.salePrice);
    if (sortOrder === 'price-high') filtered.sort((left, right) => right.salePrice - left.salePrice);
    return filtered;
  }, [resolvedProducts, search, categoryFilter, categories, brands, offerOnly, sortOrder]);
  const cartItems = cart.map((line) => {
    const product = resolvedProducts.find((item) => item.id === line.productId) || products.find((item) => item.id === line.productId);
    return product ? { ...product, quantity: Math.min(line.quantity, Math.max(0, Number(product.stock) || 0)) } : null;
  }).filter((item): item is Product & { quantity: number } => Boolean(item && item.quantity > 0));
  const directOrderProduct = directOrderItem && (resolvedProducts.find((item) => item.id === directOrderItem.productId) || products.find((item) => item.id === directOrderItem.productId));
  const checkoutItems = directOrderItem
    ? directOrderProduct ? [{ ...directOrderProduct, quantity: Math.min(directOrderItem.quantity, Number(directOrderProduct.stock) || 0) }] : []
    : cartItems;
  const checkoutSubtotal = checkoutItems.reduce((sum, item) => sum + currentPrice(item, offers, today) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + currentPrice(item, offers, today) * item.quantity, 0);
  const selectedRate = rates.find((rate) => rate.area === form.shippingArea);
  const shippingCost = selectedRate?.price || 0;
  const orderTotal = subtotal + shippingCost;
  const checkoutTotal = checkoutSubtotal + shippingCost;
  const uniqueImageProducts = resolvedProducts.filter((product, index, allProducts) => {
    const image = productImage(product);
    return !image || allProducts.findIndex((candidate) => productImage(candidate) === image) === index;
  });
  const featuredProducts = uniqueImageProducts.slice(0, 2);
  const firstFeaturedProduct = featuredProducts[0];
  if (firstFeaturedProduct) {
    const firstCategory = categories.find((entry) => entry.id === firstFeaturedProduct.categoryId)?.name || firstFeaturedProduct.category || '';
    const differentCategoryProduct = uniqueImageProducts.find((product) => {
      const category = categories.find((entry) => entry.id === product.categoryId)?.name || product.category || '';
      return product.id !== firstFeaturedProduct.id && category !== firstCategory;
    });
    if (differentCategoryProduct) featuredProducts[1] = differentCategoryProduct;
  }

  function changeQuantity(productId: string, quantity: number) {
    const product = products.find((item) => item.id === productId);
    const nextQuantity = Math.min(20, Number(product?.stock) || 0, Math.max(0, quantity));
    setCart((current) => nextQuantity === 0
      ? current.filter((line) => line.productId !== productId)
      : current.some((line) => line.productId === productId)
        ? current.map((line) => line.productId === productId ? { ...line, quantity: nextQuantity } : line)
        : [...current, { productId, quantity: nextQuantity }]);
  }

  function addToCart(product: Product) {
    const existing = cart.find((line) => line.productId === product.id)?.quantity || 0;
    if (existing >= Math.min(20, Number(product.stock))) { setToast('وصلت للحد المتاح من القطعة.'); return; }
    changeQuantity(product.id, existing + 1);
    setToast('اتضافت القطعة للشنطة.');
  }

  function beginCheckout() {
    setCheckoutError('');
    setOrderNumber('');
    setOrderShippingPending(false);
    setDirectOrderItem(null);
    setCheckoutOpen(true);
  }

  function buyNow(product: Product) {
    setCheckoutError('');
    setOrderNumber('');
    setOrderShippingPending(false);
    setDirectOrderItem({ productId: product.id, quantity: 1 });
    setActiveProduct(null);
    setCartOpen(false);
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
        body: JSON.stringify({ ...form, items: checkoutItems.map((item) => ({ productId: item.id, quantity: item.quantity })) }),
      });
      const result = await response.json() as { error?: string; orderId?: string; shippingPending?: boolean };
      if (!response.ok || !result.orderId) throw new Error(result.error || 'تعذر تسجيل الطلب.');
      if (rememberCheckoutDetails) saveCheckoutCookie(form);
      else clearCheckoutCookie();
      setOrderNumber(result.orderId);
      setOrderShippingPending(result.shippingPending === true);
      if (!directOrderItem) setCart([]);
      setDirectOrderItem(null);
      setCartOpen(true);
      setCheckoutOpen(false);
    } catch (reason) {
      setCheckoutError(reason instanceof Error ? reason.message : 'تعذر تسجيل الطلب. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }

  const location = [profile.city, profile.governorate].filter(Boolean).join('، ');
  return <main className="store-shell">
    <div className="announcement"><span className="announcement-dot" /> شغل متفصل بعناية في القاهرة <span className="announcement-divider">/</span> توصيل لكل المحافظات</div>
    <header className="site-header">
      <button className="mobile-nav-button icon-button" title="القائمة" onClick={() => document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })}><Menu size={19} /></button>
      <a className="wordmark" href="#top" aria-label="R/ONE الصفحة الرئيسية"><span className="wordmark-r">R/</span><span className="wordmark-name">ONE<small>MADE TO MOVE</small></span></a>
      <nav className="header-links" aria-label="التنقل الرئيسي"><a href="#collections">القطع</a><a href="#story">عن الورشة</a><a href="#contact">تواصل</a></nav>
      <div className="header-actions">
        <label className="header-search"><Search size={16} /><input aria-label="ابحث في المنتجات" placeholder="بتدور على إيه؟" value={search} onChange={(event) => { setSearch(event.target.value); document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' }); }} /><kbd>/</kbd></label>
        <button className="bag-button" type="button" onClick={() => setCartOpen(true)} aria-label={`فتح الشنطة، ${cartCount} قطعة`}><ShoppingBag size={18} /><span>الشنطة</span><b>{cartCount}</b></button>
      </div>
    </header>

    <section className="intro-band" id="top">
      <div className="intro-copy"><span className="eyebrow"><i /> R/ONE · ورشة ملابس شبابية</span><h1>مصنوع للحركة.<br /><em>ومفصّل على مقاسك.</em></h1><p>{profile.description || 'قطع أساسية بتفاصيل محسوبة، من قلب الورشة لحد بابك.'}</p><a className="intro-link" href="#collections">اكتشف المجموعة <ArrowDownLeft size={16} /></a></div>
      <div className="intro-products" aria-label="اختيارات من المجموعة">
        {featuredProducts.length ? featuredProducts.map((product, index) => {
          const image = productImage(product);
          const price = currentPrice(product, offers, today);
          const discounted = price < Number(product.price);
          const category = categories.find((entry) => entry.id === product.categoryId)?.name || product.category || 'R/ONE';
          return <article className={`intro-product-card intro-product-card-${index + 1}`} key={product.id}>
            <button className="intro-product-media" type="button" onClick={() => setActiveProduct(product)} aria-label={`عرض ${product.name}`}>
              {image ? <img src={image} alt={product.name} /> : <div className={`intro-product-placeholder placeholder-${index}`}><span>R/</span><b>ONE</b></div>}
              <span className="intro-product-index">R/ 0{index + 1}</span>
              {discounted && <span className="intro-product-sale">عرض</span>}
            </button>
            <div className="intro-product-info"><div className="intro-product-copy"><span>{category}</span><strong>{product.name}</strong></div><div className="intro-product-buy"><span>{money.format(price)}{discounted && <del>{money.format(product.price)}</del>}</span><button type="button" title={`أضف ${product.name} للشنطة`} onClick={() => addToCart(product)}><Plus size={16} /></button></div></div>
          </article>;
        }) : <div className="intro-products-empty"><span>R/ONE</span><small>اختيارات من المجموعة</small></div>}
      </div>
    </section>

    <div className="service-strip" aria-label="مزايا التسوق"><span><PackageCheck size={16} /> تصنيع محلي</span><i /><span><MapPin size={16} /> توصيل لكل مصر</span><i /><span><Clock3 size={16} /> متابعة مباشرة للطلب</span><i /><span className="strip-location">{location || profile.name}</span></div>

    <section className="collection-section" id="collections">
      <div className="collection-heading"><div><span className="eyebrow">المجموعة الحالية <i /></span><h2>اختار قطعتك</h2><p>قطع متصممة تتحرك معاك، كل يوم.</p></div><div className="collection-count"><strong>{filteredProducts.length.toString().padStart(2, '0')}</strong><span>قطعة متاحة</span></div></div>
      <div className="catalog-controls"><div className="category-tabs" role="group" aria-label="تصفية حسب النوع"><button className={categoryFilter === 'all' ? 'category-active' : ''} onClick={() => setCategoryFilter('all')}>الكل <span>{availableProducts.length}</span></button>{categories.map((category) => <button key={category.id} className={categoryFilter === category.id ? 'category-active' : ''} onClick={() => setCategoryFilter(category.id)}>{category.name}</button>)}</div><div className="catalog-filters"><button className={`offer-filter ${offerOnly ? 'offer-filter-active' : ''}`} onClick={() => setOfferOnly((current) => !current)}><span /> عليه عرض</button><label className="sort-select"><select aria-label="ترتيب المنتجات" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="featured">ترتيب: المقترحة</option><option value="price-low">السعر: الأقل أولاً</option><option value="price-high">السعر: الأعلى أولاً</option></select><ChevronDown size={14} /></label></div></div>

      {dataError && <div className="store-notice" role="alert"><CircleHelp size={16} /><span>{dataError}</span></div>}
      {loading ? <div className="loading-products"><span className="loading-spinner" /> بنجهّز المجموعة...</div> : filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product, index) => {
        const image = productImage(product);
        const discounted = product.salePrice < Number(product.price);
        const category = categories.find((entry) => entry.id === product.categoryId)?.name || product.category || 'R/ONE';
        return <article className="product-card" key={product.id} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
          <button className="product-media" type="button" onClick={() => setActiveProduct(product)} aria-label={`عرض ${product.name}`}>
            {image ? <img src={image} alt={product.name} loading={index > 3 ? 'lazy' : 'eager'} /> : <div className={`product-placeholder placeholder-${index % 4}`}><span>R/</span><b>ONE</b></div>}
            <span className="product-index">R/ {String(index + 1).padStart(2, '0')}</span>
            {discounted && <span className="sale-label">عرض</span>}
            <span className="quick-view"><Search size={15} /> نظرة سريعة</span>
          </button>
          <div className="product-meta"><div><span>{category}</span>{product.brand && <span> · {product.brand}</span>}</div><span className="stock-note">{product.stock <= 5 ? `باقي ${product.stock}` : 'متاح'}</span></div>
          <div className="product-name-row"><button type="button" onClick={() => setActiveProduct(product)}>{product.name}</button><button className="add-button" type="button" title="أضف للشنطة" onClick={() => addToCart(product)}><Plus size={18} /></button></div>
          <div className="product-price">{discounted ? <><strong>{money.format(product.salePrice)}</strong><del>{money.format(product.price)}</del></> : <strong>{money.format(product.price)}</strong>}<small>EGP</small></div>
          <button className="product-buy-now" type="button" onClick={() => buyNow(product)}>شراء مباشر <ArrowLeft size={14} /></button>
          {product.offerTitle && discounted && <span className="product-offer-title">{product.offerTitle}</span>}
        </article>;
      })}</div> : <div className="empty-catalog"><span className="empty-mark">R/</span><h3>{dataError ? 'الكتالوج مش متاح دلوقتي' : 'مفيش قطع مطابقة'}</h3><p>{dataError ? 'تأكد من إعدادات Firebase وقواعد Firestore، وبعدها حدّث الصفحة.' : 'جرّب تغيّر كلمة البحث أو اختار تصنيف تاني.'}</p><button type="button" onClick={() => { setSearch(''); setCategoryFilter('all'); setOfferOnly(false); }}>عرض كل القطع <ArrowLeft size={15} /></button></div>}
    </section>

    <section className="workshop-band" id="story"><div className="workshop-number">R/01 <i /></div><div className="workshop-story"><span className="eyebrow">من قلب الورشة</span><h2>{profile.name || 'ورشة R/ONE'}<br /><em>من أول غرزة لآخر تفصيلة.</em></h2><p>{profile.description}</p></div><div className="workshop-details"><span><MapPin size={15} /> {[profile.address, location].filter(Boolean).join('، ') || 'القاهرة، مصر'}</span>{profile.workingHours && <span><Clock3 size={15} /> {profile.workingHours}</span>}<a href="#contact">تعرف علينا <ArrowUpLeft size={15} /></a></div></section>

    <footer className="site-footer" id="contact"><a className="footer-wordmark" href="#top"><span>R/</span>ONE</a><p>تفاصيل معمولة علشان تعيش.</p><div className="footer-contact">{profile.phone && <a href={`tel:${profile.phone}`}>{profile.phone}</a>}{profile.whatsapp && <a href={whatsappHref(profile.whatsapp)} target="_blank" rel="noreferrer"><Send size={15} /> واتساب</a>}{profile.instagram && <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://${profile.instagram}`} target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a>}{profile.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}</div><span className="copyright">© {new Date().getFullYear()} R/ONE WORKSHOP · MADE IN EGYPT</span></footer>

    {cartOpen && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="drawer-heading"><div><span className="eyebrow">R/ONE · طلبك</span><h2 id="cart-title">شنطة التسوق <small>{cartCount}</small></h2></div><button className="icon-button" title="إغلاق" onClick={() => setCartOpen(false)}><X size={19} /></button></div>
      {orderNumber ? <div className="order-success"><span><Check size={22} /></span><small>تم تأكيد طلبك</small><h3>طلبك في طريقه للورشة.</h3><p>رقم الطلب</p><strong dir="ltr">#{orderNumber.slice(-6).toUpperCase()}</strong><button className="button-dark" onClick={() => { setOrderNumber(''); setCartOpen(false); }}>كمّل التصفح <ArrowLeft size={16} /></button></div> : <>
        <div className="cart-items">{cartItems.length ? cartItems.map((item) => { const image = productImage(item); const price = currentPrice(item, offers, today); return <div className="cart-item" key={item.id}><div className="cart-item-image">{image ? <img src={image} alt={item.name} /> : <span>R/</span>}</div><div className="cart-item-info"><span className="eyebrow">{item.category || 'R/ONE'}</span><strong>{item.name}</strong><span>{money.format(price)}</span><div className="quantity-stepper"><button type="button" title="تقليل الكمية" onClick={() => changeQuantity(item.id, item.quantity - 1)}><Minus size={13} /></button><span>{item.quantity}</span><button type="button" title="زيادة الكمية" disabled={item.quantity >= Math.min(20, Number(item.stock))} onClick={() => changeQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button></div></div><button className="remove-line" type="button" title="إزالة المنتج" onClick={() => changeQuantity(item.id, 0)}><X size={15} /></button></div>; }) : <div className="cart-empty"><ShoppingBag size={25} /><strong>الشنطة لسه فاضية</strong><p>ابدأ اختار القطع اللي عجبتك.</p><button type="button" onClick={() => { setCartOpen(false); document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' }); }}>شوف المجموعة <ArrowLeft size={14} /></button></div>}</div>
        {cartItems.length > 0 && <div className="cart-summary"><div><span>قيمة القطع</span><strong>{money.format(subtotal)}</strong></div><div><span>التوصيل</span><strong>{selectedRate ? money.format(shippingCost) : 'يُحدد عند الدفع'}</strong></div><div className="cart-grand-total"><span>الإجمالي</span><strong>{money.format(orderTotal)}</strong></div><button className="checkout-button" type="button" onClick={beginCheckout}>أكمل بيانات التوصيل <ArrowLeft size={17} /></button><small><PackageCheck size={13} /> مخزون القطع بيتأكد عند تسجيل الطلب</small></div>}
      </>}</aside></div>}

    {checkoutOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setCheckoutOpen(false); }}>
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <div className="drawer-heading"><div><span className="eyebrow">خطوة أخيرة</span><h2 id="checkout-title">{directOrderItem ? 'شراء مباشر' : 'بيانات التوصيل'}</h2></div><button className="icon-button" title="إغلاق" onClick={() => setCheckoutOpen(false)}><X size={19} /></button></div>
        <form className="checkout-form" onSubmit={submitOrder}>
          <div className="checkout-order-summary" aria-label="المنتجات في الطلب">{checkoutItems.map((item) => <div key={item.id}><span>{item.name} <small>× {item.quantity}</small></span><strong>{money.format(currentPrice(item, offers, today) * item.quantity)}</strong></div>)}</div>
          <label>الاسم بالكامل<input autoComplete="name" required maxLength={100} value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} placeholder="اكتب اسمك" /></label>
          <label>رقم الموبايل<input autoComplete="tel" type="tel" dir="ltr" required minLength={8} maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01xxxxxxxxx" /></label>
          <div className="checkout-two">
            <label>المحافظة / منطقة التوصيل<input autoComplete="address-level1" list="r-one-shipping-areas" required maxLength={80} value={form.shippingArea} onChange={(event) => setForm({ ...form, shippingArea: event.target.value, city: form.city || event.target.value })} placeholder="اكتب المحافظة أو المنطقة" /><datalist id="r-one-shipping-areas">{rates.map((rate) => <option key={rate.id} value={rate.area} label={`${money.format(rate.price)} · ${rate.deliveryDays} أيام`} />)}</datalist><small className="shipping-field-hint">{selectedRate ? `الشحن ${money.format(selectedRate.price)} · ${selectedRate.deliveryDays} أيام عمل` : 'اكتب منطقتك حتى لو مش موجودة في القائمة؛ هنأكد تكلفة الشحن معاك.'}</small></label>
            <label>المدينة / المركز<input autoComplete="address-level2" required maxLength={60} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="المدينة أو المركز" /></label>
          </div>
          <label>العنوان بالتفصيل<input autoComplete="street-address" required minLength={6} maxLength={240} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="الشارع، رقم العمارة، الدور، علامة مميزة" /></label>
          <div className="remember-details"><label className="remember-details-toggle"><input type="checkbox" checked={rememberCheckoutDetails} onChange={(event) => { setRememberCheckoutDetails(event.target.checked); if (!event.target.checked) clearCheckoutCookie(); }} /><span>احفظ بياناتي في كوكي على هذا الجهاز</span></label><small>اختياري · لمدة 90 يومًا، ويمكنك إلغاء الاختيار في أي وقت.</small></div>
          {selectedRate ? <div className="delivery-estimate"><PackageCheck size={16} /><span>التوصيل إلى {selectedRate.area}</span><strong>{money.format(shippingCost)}</strong><small>{selectedRate.deliveryDays} أيام عمل</small></div> : <div className="delivery-pending-note"><PackageCheck size={16} /><span>هنأكد تكلفة وموعد التوصيل قبل تجهيز الطلب.</span>{profile.whatsapp && <a href={whatsappHref(profile.whatsapp, 'مرحباً، أريد الاستفسار عن تكلفة توصيل طلبي من R/ONE.')} target="_blank" rel="noreferrer">اسألنا على واتساب <ArrowUpLeft size={14} /></a>}</div>}
          {checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}
          <div className="checkout-total"><span>{selectedRate ? 'الإجمالي شامل التوصيل' : 'قيمة المنتجات قبل تأكيد الشحن'}</span><strong>{money.format(checkoutTotal)}</strong></div>
          <button className="checkout-button" type="submit" disabled={busy || !checkoutItems.length}>{busy ? 'جارٍ تأكيد الطلب...' : <>{directOrderItem ? 'أكد الشراء' : 'أكد الطلب'} <ArrowLeft size={17} /></>}</button>
          <p className="checkout-note">هنتواصل معاك لتأكيد الطلب وموعد التوصيل.</p>
        </form>
      </section>
    </div>}

    {activeProduct && <div className="modal-backdrop product-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveProduct(null); }}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-detail-title"><button className="icon-button product-modal-close" title="إغلاق" onClick={() => setActiveProduct(null)}><X size={19} /></button><div className="detail-media">{productImage(activeProduct) ? <img src={productImage(activeProduct)} alt={activeProduct.name} /> : <div className="product-placeholder"><span>R/</span><b>ONE</b></div>}<span className="detail-image-index">R/ONE · {activeProduct.sku || 'WORKSHOP'}</span></div><div className="detail-copy"><span className="eyebrow">{activeProduct.category || 'من المجموعة الحالية'}</span><h2 id="product-detail-title">{activeProduct.name}</h2><div className="detail-price">{currentPrice(activeProduct, offers, today) < Number(activeProduct.price) && <del>{money.format(activeProduct.price)}</del>}<strong>{money.format(currentPrice(activeProduct, offers, today))}</strong></div><div className="detail-divider" /><p>قطعة متصنعة بعناية في ورشة R/ONE. جاهزة تتحرك معاك كل يوم.</p><div className="detail-stock"><i /> {activeProduct.stock <= 5 ? `متبقي ${activeProduct.stock} قطع` : 'متاحة للطلب'}</div><button className="checkout-button" type="button" onClick={() => { addToCart(activeProduct); setActiveProduct(null); setCartOpen(true); }}>أضف للشنطة <ShoppingBag size={17} /></button><button className="detail-buy-now" type="button" onClick={() => buyNow(activeProduct)}>شراء مباشر <ArrowLeft size={15} /></button><small className="detail-shipping"><PackageCheck size={14} /> التوصيل متاح حسب منطقتك</small></div></section></div>}

    {profile.whatsapp && <a className={`whatsapp-float ${orderNumber && orderShippingPending ? 'whatsapp-order-followup' : ''}`} href={whatsappHref(profile.whatsapp, orderNumber && orderShippingPending ? `مرحباً، أريد تأكيد تكلفة الشحن لطلبي رقم ${orderNumber}.` : 'مرحباً، عندي استفسار عن منتجات R/ONE.')} target="_blank" rel="noreferrer" aria-label={orderNumber && orderShippingPending ? 'تأكيد تكلفة شحن الطلب على واتساب' : 'تواصل مع الورشة على واتساب'}><Send size={17} /><span>{orderNumber && orderShippingPending ? 'تأكيد شحن طلبي' : 'استفسار واتساب'}</span></a>}
    {toast && <div className="store-toast"><span><Check size={14} /></span>{toast}</div>}
  </main>;
}