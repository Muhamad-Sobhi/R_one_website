'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, Minus, PackageCheck, Plus, ShoppingBag, X } from 'lucide-react';
import { useOverlayLock } from '@/lib/hooks';
import {
  CURRENCY_LABEL,
  type ResolvedProduct,
  formatMoney,
} from '@/lib/store';

type CartItem = ResolvedProduct & { quantity: number };

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onQuantity: (productId: string, quantity: number) => void;
  onBrowse: () => void;
  brand: string;
  count: number;
  subtotal: number;
  total?: number;
  shipping?: ReactNode;
  actions?: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
};

export default function CartDrawer({
  open,
  onClose,
  items,
  onQuantity,
  onBrowse,
  brand,
  count,
  subtotal,
  total,
  shipping,
  actions,
  note,
  children,
}: CartDrawerProps) {
  useOverlayLock(open, onClose);
  if (!open) return null;

  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">{brand} · طلبك</span>
            <h2 id="cart-title">شنطة التسوق <small>{count}</small></h2>
          </div>
          <button className="icon-button" type="button" title="إغلاق" aria-label="إغلاق الشنطة" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        {children ?? (
          <>
            <div className="cart-items">
              {items.length ? (
                items.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <Link className="cart-item-image" href={`/product/${item.id}`} onClick={onClose} aria-label={`عرض ${item.name}`}>
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="80px" className="cart-item-img" />
                      ) : (
                        <span>R/</span>
                      )}
                    </Link>
                    <div className="cart-item-info">
                      <span className="eyebrow">{item.categoryLabel}</span>
                      <Link className="cart-item-name" href={`/product/${item.id}`} onClick={onClose}>{item.name}</Link>
                      <span>{formatMoney(item.salePrice)} {CURRENCY_LABEL}</span>
                      <div className="quantity-stepper">
                        <button type="button" title="تقليل الكمية" aria-label="تقليل الكمية" onClick={() => onQuantity(item.id, item.quantity - 1)}>
                          <Minus size={13} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          title="زيادة الكمية"
                          aria-label="زيادة الكمية"
                          disabled={item.quantity >= Math.min(20, Number(item.stock))}
                          onClick={() => onQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <button className="remove-line" type="button" title="إزالة المنتج" aria-label={`إزالة ${item.name}`} onClick={() => onQuantity(item.id, 0)}>
                      <X size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="cart-empty">
                  <ShoppingBag size={25} />
                  <strong>الشنطة لسه فاضية</strong>
                  <p>ابدأ اختار القطع اللي عجبتك.</p>
                  <button type="button" onClick={onBrowse}>شوف المجموعة <ArrowLeft size={14} /></button>
                </div>
              )}
            </div>

            {items.length ? (
              <div className="cart-summary">
                <div><span>قيمة القطع</span><strong>{formatMoney(subtotal)} {CURRENCY_LABEL}</strong></div>
                {shipping}
                <div className="cart-grand-total"><span>الإجمالي</span><strong>{formatMoney(total ?? subtotal)} {CURRENCY_LABEL}</strong></div>
                {actions}
                <small><PackageCheck size={13} /> مخزون القطع بيتأكد عند تسجيل الطلب</small>
                {note}
              </div>
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}