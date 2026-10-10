'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Eye, Send, ShoppingBag } from 'lucide-react';
import {
  CURRENCY_LABEL,
  type ResolvedProduct,
  formatMoney,
  highlightParts,
  stockState,
} from '@/lib/store';
import WhatsAppPicker from '@/components/whatsapp-picker';
import { cartActions } from '@/lib/cart-store';
import { trackEvent } from '@/lib/analytics';
import { useStoreData, useToast } from '@/lib/hooks';

type ProductCardProps = {
  product: ResolvedProduct;
  index?: number;
  tokens?: string[];
  hrefPrefix?: string;
  onAdd?: (product: ResolvedProduct) => void;
  quickLabel?: string;
  buyLabel?: string;
  reason?: string;
  priority?: boolean;
  wide?: boolean;
  children?: ReactNode;
};

/**
 * .product-card عليه transform من الـanimation، فأي عنصر fixed جوه بياخده
 * كـ containing block ويتحسب مكانه جوّه الكرت بدل الشاشة.
 * بن_portal__ الـoverlays على body عشان تظهر في نص الشاشة.
 */
function useOverlayHost() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  return host;
}

function NameWithHighlight({ name, tokens }: { name: string; tokens?: string[] }) {
  const parts = highlightParts(name, tokens ?? []);
  return (
    <>
      {parts.map((part, partIndex) => (part.match ? <mark key={partIndex}>{part.text}</mark> : <span key={partIndex}>{part.text}</span>))}
    </>
  );
}

export default function ProductCard({
  product,
  index = 0,
  tokens = [],
  hrefPrefix = '/product',
  onAdd,
  quickLabel = 'عرض المنتج',
  buyLabel = 'عرض وشراء',
  reason,
  priority = false,
  wide = false,
  children,
}: ProductCardProps) {
  const { profile } = useStoreData();
  const { showToast } = useToast();
  const overlayHost = useOverlayHost();
  const [pickerOpen, setPickerOpen] = useState(false);

  const href = `${hrefPrefix}/${product.id}`;
  const stock = stockState(product.stock);
  const sequence = String(index + 1).padStart(2, '0');
  const whatsapp = profile.whatsapp;

  const firstSize = product.sizes?.[0];
  const sizeName = firstSize && typeof firstSize !== 'string' ? firstSize.name : firstSize;
  const colorName = product.colors?.[0]?.name;

  function addToCart() {
    const next = cartActions.changeVariant(product.id, sizeName, colorName, 1);
    if (next <= 0) {
      showToast('وصلت للحد المتاح من القطعة.');
      return;
    }
    trackEvent({ event: 'add_to_cart', productId: product.id, productName: product.name });
    onAdd?.(product);
  }

  const quickMessage = [
    '*طلب من R/ONE*',
    `المنتج: ${product.name}`,
    colorName ? `اللون: ${colorName}` : '',
    sizeName ? `المقاس: ${sizeName}` : '',
    product.sku ? `الكود: ${product.sku}` : '',
    `السعر: ${formatMoney(product.salePrice)} ${CURRENCY_LABEL}`,
    'من صفحة المنتجات.',
  ].filter(Boolean).join('\n');

  return (
    <article className={`product-card ${wide ? 'product-card-wide' : ''}`} style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}>
      <Link className="product-media" href={href} aria-label={`عرض ${product.name}`}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 700px) 44vw, (max-width: 1050px) 29vw, 22vw"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="product-media-img"
          />
        ) : (
          <div className="product-placeholder"><span>R/</span><b>ONE</b></div>
        )}
        <span className="product-index">R/ {sequence}</span>
        {product.discounted ? <span className="sale-label">عرض</span> : null}
        {!stock.available ? <span className="sold-out-label">خلص</span> : null}
        <span className="quick-view"><Eye size={15} /> {quickLabel}</span>
      </Link>

      <div className="product-meta">
        <div>
          <span>{product.categoryLabel}</span>
          {product.brandLabel ? <span> · {product.brandLabel}</span> : null}
        </div>
        <span className={stock.low && stock.available ? 'stock-note' : ''}>{stock.available ? (stock.low ? `باقي ${product.stock}` : 'متاح') : 'غير متاح'}</span>
      </div>

      <div className="product-name-row">
        <Link href={href} title={product.name}>
          <NameWithHighlight name={product.name} tokens={tokens} />
        </Link>
        <button
          className="add-button"
          type="button"
          title="أضف للسلة"
          aria-label={`أضف ${product.name} للسلة`}
          disabled={!stock.available}
          onClick={addToCart}
        >
          <ShoppingBag size={17} />
        </button>
      </div>

      <div className="product-price">
        {product.discounted ? (
          <>
            <strong>{formatMoney(product.salePrice)}</strong>
            <del>{formatMoney(product.price)}</del>
          </>
        ) : (
          <strong>{formatMoney(product.price)}</strong>
        )}
        <small>{CURRENCY_LABEL}</small>
      </div>

      <div className="product-cta-row">
        <Link className="product-buy-now" href={href}>
          {buyLabel} <ArrowLeft size={14} />
        </Link>
        {whatsapp ? (
          <button className="product-quick-order" type="button" disabled={!stock.available} onClick={() => setPickerOpen(true)}>
            <Send size={14} /> اطلب دلوقتي
          </button>
        ) : null}
      </div>

      {reason ? <span className="product-reason">{reason}</span> : null}
      {product.offerTitle && product.discounted ? <span className="product-offer-title">{product.offerTitle}</span> : null}
      {children}

      {overlayHost && pickerOpen ? createPortal(
        <WhatsAppPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onOpened={() => trackEvent({ event: 'whatsapp' })}
          phone={whatsapp ?? ''}
          title={`اطلب «${product.name}»`}
          message={quickMessage}
          note="جهازك فيه أكتر من تطبيق واتساب؟ اختار اللي تحب توصلنا عليه."
        />,
        overlayHost,
      ) : null}
    </article>
  );
}
