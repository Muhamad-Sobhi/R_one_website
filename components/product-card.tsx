'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, Eye, ShoppingBag } from 'lucide-react';
import {
  CURRENCY_LABEL,
  type ResolvedProduct,
  formatMoney,
  highlightParts,
  stockState,
} from '@/lib/store';

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
  const href = `${hrefPrefix}/${product.id}`;
  const stock = stockState(product.stock);
  const sequence = String(index + 1).padStart(2, '0');

  return (
    <article className={`product-card ${wide ? 'product-card-wide' : ''}`} style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}>
      <Link className="product-media" href={href} aria-label={`عرض ${product.name}`}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 700px) 50vw, (max-width: 1050px) 33vw, 25vw"
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
        {onAdd ? (
          <button
            className="add-button"
            type="button"
            title="أضف للشنطة"
            aria-label={`أضف ${product.name} للشنطة`}
            disabled={!stock.available}
            onClick={() => onAdd(product)}
          >
            <ShoppingBag size={17} />
          </button>
        ) : null}
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

      <Link className="product-buy-now" href={href}>
        {buyLabel} <ArrowLeft size={14} />
      </Link>

      {reason ? <span className="product-reason">{reason}</span> : null}
      {product.offerTitle && product.discounted ? <span className="product-offer-title">{product.offerTitle}</span> : null}
      {children}
    </article>
  );
}