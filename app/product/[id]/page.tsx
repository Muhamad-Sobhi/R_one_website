'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  Maximize2,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  Clock3,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Send,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import CartDrawer from '@/components/cart-drawer';
import CustomerGate, { readCustomer } from '@/components/customer-gate';
import WhatsAppPicker from '@/components/whatsapp-picker';
import ImageLightbox from '@/components/image-lightbox';
import ProductOptions from '@/components/product-options';
import ProductReviews from '@/components/product-reviews';
import ProductCard from '@/components/product-card';
import SiteFooter from '@/components/site-footer';
import SiteHeader, { type NavLink } from '@/components/site-header';
import { useCart, useProductReviews, useScrolled, useStoreData, useToast } from '@/lib/hooks';
import { trackEvent, useTrackView } from '@/lib/analytics';
import {
  CURRENCY_LABEL,
  MAX_QUANTITY,
  brandName,
  colorImages,
  formatMoney,
  maxOrderQuantity,
  productColors,
  productSizes,
  sizeStock,
  formatPrice,
  pickRelated,
  productImages,
  stockState,
  whatsappHref,
} from '@/lib/store';

const NAV_LINKS: NavLink[] = [
  { href: '/#collections', label: 'القطع' },
  { href: '/#story', label: 'عنّا' },
  { href: '/#contact', label: 'تواصل' },
];

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = typeof params?.id === 'string' ? params.id : '';
  const { products, catalog, available, profile, rates, loading } = useStoreData();
  const reviews = useProductReviews(productId);
  const cart = useCart(products);
  const { toast, showToast } = useToast();

  const [cartOpen, setCartOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [gateOpen, setGateOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [pendingAction, setPendingAction] = useState<null | 'product' | 'cart'>(null);
  const [search, setSearch] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const showBackToTop = useScrolled(500);

  useEffect(() => {
    if (!search.trim()) {
      sessionStorage.removeItem('r-one-search');
      return;
    }
    const timer = window.setTimeout(() => {
      sessionStorage.setItem('r-one-search', search);
      router.push('/#collections');
    }, 650);
    return () => window.clearTimeout(timer);
  }, [search, router]);

  const name = brandName(profile.name);
  const product = useMemo(() => catalog.find((item) => item.id === productId) ?? null, [catalog, productId]);
  const images = useMemo(() => (product ? colorImages(product, color || undefined) : []), [product, color]);
  const sizes = useMemo(() => (product ? productSizes(product) : []), [product]);
  const colors = useMemo(() => (product ? productColors(product) : []), [product]);
  const needsSize = sizes.length > 0;
  const stock = product ? stockState(Number(product.stock) || 0) : null;
  const variantStock = product ? sizeStock(product, size || undefined) : 0;
  const related = useMemo(() => (product ? pickRelated(available, product, 4) : []), [available, product]);

  useTrackView(product?.id, product?.name);

  const cartItems = useMemo(
    () =>
      cart.lines
        .map((line) => {
          const item = available.find((entry) => entry.id === line.productId);
          if (!item) return null;
          const safeQuantity = Math.min(line.quantity, maxOrderQuantity(item, line.size));
          return safeQuantity > 0 ? { ...item, quantity: safeQuantity, size: line.size, color: line.color } : null;
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [cart.lines, available],
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

  const maxQuantity = product ? maxOrderQuantity(product, size || undefined) : 1;
  const selectionMissing = Boolean(product && needsSize && !size);

  function changeColor(next: string) {
    setColor(next);
    setActiveImage(0);
  }

  function addToCart() {
    if (!product) return;
    if (needsSize && !size) {
      showToast('اختار المقاس الأول.');
      return;
    }
    const existingLine = cart.lines.find((line) => line.productId === product.id && (line.size ?? '') === size && (line.color ?? '') === color);
    const current = existingLine?.quantity || 0;
    if (current + quantity > maxQuantity) {
      showToast('وصلت للحد المتاح من القطعة.');
      return;
    }
    cart.changeVariant(product.id, size || undefined, color || undefined, current + quantity);
    trackEvent({ event: 'add_to_cart', productId: product.id, productName: product.name });
    showToast('اتضافت القطعة للسلة.');
    setCartOpen(true);
  }

  function requestOrderViaWhatsApp() {
    if (!product || !profile.whatsapp) return;
    if (needsSize && !size) {
      showToast('اختار المقاس الأول.');
      return;
    }
    setPendingAction('product');
    setPlacedOrderId('');
    setPendingMessage('');
    setGateOpen(true);
  }

  const gateOrderItems = useMemo(() => {
    if (pendingAction === 'cart') {
      return cartItems.map((item) => ({ productId: item.id, quantity: item.quantity, ...(item.size ? { size: item.size } : {}), ...(item.color ? { color: item.color } : {}) }));
    }
    if (!product) return [];
    return [{ productId: product.id, quantity, ...(size ? { size } : {}), ...(color ? { color } : {}) }];
  }, [pendingAction, cartItems, product, quantity, size, color]);

  function openProductWhatsApp(customer?: ReturnType<typeof readCustomer>) {
    if (!product || !profile.whatsapp) return;
    const who = customer ? `${product.name}${customer.name ? `
العميل: ${customer.name}` : ''}${customer.phone ? `
الموبايل: ${customer.phone}` : ''}
` : '';
    const lines = [
      `*طلب منتج من ${name}*`,
      who,
      `المنتج: ${product.name}`,
      color ? `اللون: ${color}` : '',
      size ? `المقاس: ${size}` : '',
      product.sku ? `الكود: ${product.sku}` : '',
      `الكمية: ${quantity}`,
      `السعر: ${formatPrice(product.salePrice)} × ${quantity} = ${formatPrice(product.salePrice * quantity)}`,
      `رابط المنتج: ${window.location.href}`,
      placedOrderId ? `رقم الطلب: ${placedOrderId}` : '',
    ].filter(Boolean);
    setPickerOpen(true);
    setPendingMessage(lines.join('\n'));
    void customer;
  }

  function openCartWhatsApp(customer?: ReturnType<typeof readCustomer>) {
    if (!profile.whatsapp) return;
    setPickerOpen(true);
    setPendingMessage(cartWhatsAppMessage(customer));
  }

  function cartWhatsAppMessage(customer?: ReturnType<typeof readCustomer>) {
    const lines = [`*طلب من سلة ${name}*`, ...(customer ? [`العميل: ${customer.name}${customer.phone ? ` (${customer.phone})` : ''}${customer.address ? `\nالعنوان: ${customer.address}` : ''}`] : [])];
    let total = 0;
    for (const item of cartItems) {
      total += item.salePrice * item.quantity;
      const options = [item.color, item.size].filter(Boolean).join(' · ');
    lines.push(`• ${item.name}${options ? ` — ${options}` : ''}${item.sku ? ` (${item.sku})` : ''} × ${item.quantity} = ${formatPrice(item.salePrice * item.quantity)}`);
    }
    lines.push(`إجمالي المنتجات: ${formatPrice(total)}`);
    lines.push('أرجو تأكيد الطلب وتكلفة التوصيل.');
    return lines.join('\n');
  }

  function currentPickerMessage() {
    if (pendingMessage) return pendingMessage;
    if (pendingAction === 'cart') return cartWhatsAppMessage(readCustomer());
    return openProductMessage(readCustomer());
  }

  function openProductMessage(customer?: ReturnType<typeof readCustomer>) {
    if (!product) return '';
    const lines = [
      `*طلب منتج من ${name}*`,
      customer?.name ? `العميل: ${customer.name}` : '',
      customer?.phone ? `الموبايل: ${customer.phone}` : '',
      customer?.address ? `العنوان: ${customer.address}` : '',
      `المنتج: ${product.name}`,
      color ? `اللون: ${color}` : '',
      size ? `المقاس: ${size}` : '',
      product.sku ? `الكود: ${product.sku}` : '',
      `الكمية: ${quantity}`,
      `السعر: ${formatPrice(product.salePrice)} × ${quantity} = ${formatPrice(product.salePrice * quantity)}`,
      placedOrderId ? `رقم الطلب: ${placedOrderId}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  }

  return (
    <main className="store-shell">
      <SiteHeader
        profile={profile}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        links={NAV_LINKS}
        searchValue={search}
        onSearchChange={setSearch}
        searchHint="اكتب في البحث وهنوديك لصفحة المجموعة بنتيجة جاهزة."
      />

      <nav className="product-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <ChevronLeft size={13} />
        {product ? (
          <Link href="/#collections">{product.categoryLabel}</Link>
        ) : (
          <Link href="/#collections">المجموعة</Link>
        )}
        {product ? <><ChevronLeft size={13} /><span>{product.name}</span></> : null}
      </nav>

      {loading || !productId ? (
        <div className="product-page-loading">
          <span className="loading-spinner" />
          <p>بنجهّز تفاصيل المنتج...</p>
        </div>
      ) : !product ? (
        <div className="product-page-notfound">
          <span className="empty-mark">R/</span>
          <h2>المنتج مش موجود</h2>
          <p>يمكن اتشال أو الرابط مش صحيح.</p>
          <Link href="/" className="button-dark">رجّع للمتجر <ArrowLeft size={15} /></Link>
        </div>
      ) : (
        <>
          <section className="product-page-detail">
            <div className="product-page-gallery">
              <button
                className="product-page-main-image"
                type="button"
                onClick={() => images.length && setLightboxOpen(true)}
                aria-label={images.length ? `تكبير صورة ${product.name}` : undefined}
                disabled={!images.length}
              >
                {images.length ? (
                  <Image
                    key={images[activeImage]}
                    src={images[activeImage]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 980px) 100vw, 45vw"
                    priority
                    className="product-page-img"
                  />
                ) : (
                  <div className="product-placeholder product-placeholder-lg">
                    <span>R/</span><b>ONE</b>
                  </div>
                )}
                {images.length ? (
                  <span className="gallery-zoom"><Maximize2 size={15} /> معاينة بالحجم الكامل</span>
                ) : null}
                {product.discounted ? <span className="sale-label sale-label-lg">{product.offerTitle || 'عرض'}</span> : null}
                <span className="detail-image-index">R/ONE · {product.sku || 'MADE TO MOVE'}</span>
                {images.length > 1 ? <span className="gallery-count">{activeImage + 1} / {images.length}</span> : null}
              </button>

              {images.length > 1 ? (
                <div className="product-page-thumbnails">
                  {images.map((image, index) => (
                    <button
                      key={image}
                      className={`product-thumb ${index === activeImage ? 'product-thumb-active' : ''}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`صورة ${index + 1} من ${product.name}`}
                      aria-pressed={index === activeImage}
                      onDoubleClick={() => setLightboxOpen(true)}
                    >
                      <Image src={image} alt="" fill sizes="70px" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="product-page-info">
              <span className="eyebrow">{product.categoryLabel}{product.brandLabel ? ` · ${product.brandLabel}` : ''}</span>
              <h1 className="product-page-name">{product.name}</h1>

              <div className="product-page-price">
                <strong>{formatMoney(product.salePrice)}</strong>
                {product.discounted ? <del>{formatMoney(product.price)}</del> : null}
                <small>{CURRENCY_LABEL}</small>
                {product.discounted && product.offerTitle ? <span className="product-offer-badge">{product.offerTitle}</span> : null}
              </div>

              <div className="product-page-divider" />

              <div className={`product-page-stock ${!stock?.available ? 'is-out' : stock?.low ? 'is-low' : ''}`}>
                <i />
                {stock?.label}{color || size ? ` · ${[color, size].filter(Boolean).join(' · ')}` : ''}
              </div>

              <ProductOptions
                product={product}
                size={size}
                color={color}
                onSizeChange={setSize}
                onColorChange={changeColor}
              />

              {product.description ? <p className="product-page-desc">{product.description}</p> : null}

              {stock?.available ? (
                <div className="product-page-qty">
                  <span>الكمية</span>
                  <div className="quantity-stepper quantity-stepper-lg">
                    <button type="button" aria-label="تقليل الكمية" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}>
                      <Minus size={14} />
                    </button>
                    <span>{quantity}</span>
                    <button type="button" aria-label="زيادة الكمية" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={quantity >= maxQuantity}>
                      <Plus size={14} />
                    </button>
                  </div>
                  {colors.length && variantStock <= 5 ? <small className="qty-note">متبقي {variantStock} من الاختيار ده</small> : null}
                </div>
              ) : null}

              <div className="product-page-actions">
                {stock?.available ? (
                  <>
                    <button className="checkout-button product-page-cart-btn" type="button" onClick={addToCart} disabled={selectionMissing}>
                  {selectionMissing ? 'اختار المقاس' : <>أضف للسلة <ShoppingBag size={17} /></>}
                </button>
                    {profile.whatsapp ? (
                      <button className="product-page-whatsapp-btn" type="button" onClick={requestOrderViaWhatsApp}>
                        <Send size={17} /> اطلب عبر واتساب
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div className="product-page-unavailable">المنتج غير متاح حالياً — شوف قطع تانية من نفس التصنيف.</div>
                )}
              </div>

              <div className="product-page-features">
                <div><PackageCheck size={15} /><span>جودة مختارة وأنت مرتاح</span></div>
                <div><Truck size={15} /><span>توصيل لكل المحافظات</span></div>
                <div><Clock3 size={15} /><span>متابعة مباشرة للطلب</span></div>
                <div><MapPin size={15} /><span>استبدال خلال 14 يوم</span></div>
              </div>

              {profile.whatsapp ? (
                <a
                  className="product-page-inquiry"
                  href={whatsappHref(profile.whatsapp, `مرحباً، عندي استفسار عن منتج: ${product.name}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send size={13} /> استفسر عن المنتج عبر واتساب <ArrowUpLeft size={13} />
                </a>
              ) : null}
            </div>
          </section>

          <ProductReviews product={product} productName={product.name} reviews={reviews} />

          {related.length ? (
            <section className="product-page-similar">
              <div className="product-page-similar-head">
                <div>
                  <span className="eyebrow">اختيارات قريبة من اختيارك <i /></span>
                  <h2>منتجات مشابهة</h2>
                </div>
                <Link className="link-underline" href="/#collections">كل المجموعة <ArrowLeft size={14} /></Link>
              </div>
              <div className="product-grid similar-grid">
                {related.map((entry, index) => (
                  <ProductCard
                    key={entry.product.id}
                    product={entry.product}
                    index={index}
                    reason={entry.reason === 'نفس التصنيف' ? entry.reason : undefined}
                    buyLabel="عرض المنتج"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <SiteFooter profile={profile} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        brand={name}
        count={cartCount}
        subtotal={subtotal}
        onQuantity={cart.changeQuantity}
        onBrowse={() => {
          setCartOpen(false);
          router.push('/#collections');
        }}
        onBuyAll={() => {
          setPendingAction('cart');
          setGateOpen(true);
        }}
        shipping={<div><span>التوصيل</span><strong>يتحدد معاك</strong></div>}
        actions={
          profile.whatsapp ? (
            <button className="checkout-button cart-whatsapp-order" type="button" onClick={() => { setPendingAction('cart'); setGateOpen(true); }}>
              <Send size={16} /> اطلب السلة عبر واتساب
            </button>
          ) : null
        }
        note={<small><Send size={13} /> أو اكمل طلبك من صفحة المجموعة والدفع عند الاستلام</small>}
      />

      <CustomerGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        reason={
          pendingAction === 'cart'
            ? 'سجّل بياناتك الأول، وبعدها هنجهّز لك رسالة واتساب جاهزة ونسجّل الطلب في لوحة التحكم.'
            : 'سجّل بياناتك الأول، وبعدها هنجهّز لك رسالة واتساب جاهزة للقطعة دي وننسجّل الطلب في لوحة التحكم.'
        }
        rates={rates}
        orderItems={gateOrderItems}
        onOrderCreated={(orderId) => {
          setGateOpen(false);
          setPlacedOrderId(orderId);
          const customer = readCustomer();
          if (pendingAction === 'cart') setPendingMessage(cartWhatsAppMessage(customer));
          else setPendingMessage(openProductMessage(customer));
          setPickerOpen(true);
        }}
      />

      <WhatsAppPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        phone={profile.whatsapp ?? ''}
        title={placedOrderId ? `طلبك #${placedOrderId.slice(-6).toUpperCase()}` : 'طلب عبر واتساب'}
        message={currentPickerMessage()}
        note="اختار تطبيق واتساب اللي عايز تبعت منه — جهازك ممكن يكون فيه أكتر من تطبيق."
        onOpened={() => { trackEvent({ event: 'whatsapp' }); setPendingAction(null); setPendingMessage(''); }}
      />

      {lightboxOpen ? (
        <ImageLightbox
          images={images}
          index={activeImage}
          alt={product?.name ?? ''}
          onIndexChange={setActiveImage}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}

      {profile.whatsapp ? (
        <a
          className="whatsapp-float"
          href={whatsappHref(profile.whatsapp, `مرحباً، عندي استفسار عن منتجات ${name}.`)}
          target="_blank"
          rel="noreferrer"
          aria-label="تواصل معنا على واتساب"
        >
          <Send size={17} /><span>استفسار واتساب</span>
        </a>
      ) : null}

      {toast ? <div className="store-toast" role="status"><span><Check size={14} /></span>{toast}</div> : null}

      <button className={`back-to-top ${showBackToTop ? 'back-to-top-visible' : ''}`} type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="العودة لأعلى الصفحة">
        <ArrowUp size={18} />
      </button>
    </main>
  );
}