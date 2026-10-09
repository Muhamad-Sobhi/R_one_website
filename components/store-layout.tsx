'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Send } from 'lucide-react';
import CartDrawer from '@/components/cart-drawer';
import { cartItemsFrom } from '@/components/checkout-flow';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { useCart, useStoreData, useToast } from '@/lib/hooks';
import { trackEvent } from '@/lib/analytics';
import { MAIN_LINKS, type NavLink, brandName, whatsappHref } from '@/lib/store';

type StoreLayoutProps = {
  children: React.ReactNode;
  links?: NavLink[];
  searchEnabled?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchResults?: number | null;
  searchHint?: string;
};

export default function StoreLayout({
  children,
  links = MAIN_LINKS,
  searchEnabled = false,
  searchValue = '',
  onSearchChange,
  searchResults = null,
  searchHint,
}: StoreLayoutProps) {
  const router = useRouter();
  const { products, available, categories, profile } = useStoreData();
  const cart = useCart(products);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { toast } = useToast();

  useEffect(() => setHydrated(true), []);

  const menuCategories = useMemo(
    () =>
      categories
        .map((entry) => ({ id: entry.id, name: entry.name, count: available.filter((product) => product.categoryId === entry.id).length }))
        .filter((entry) => entry.count > 0),
    [categories, available],
  );

  const items = useMemo(() => cartItemsFrom(available, cart.lines), [available, cart.lines]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const name = brandName(profile.name);

  return (
    <div className="store-shell">
      <SiteHeader
        profile={profile}
        cartCount={hydrated ? count : 0}
        onOpenCart={() => setCartOpen(true)}
        links={links}
        searchValue={searchValue}
        onSearchChange={searchEnabled ? onSearchChange : undefined}
        searchResults={searchEnabled ? searchResults : null}
        searchHint={searchHint}
        categories={menuCategories}
      />

      <div className="store-page">{children}</div>

      <SiteFooter profile={profile} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        brand={name}
        count={count}
        subtotal={subtotal}
        onQuantity={cart.changeQuantity}
        onBrowse={() => setCartOpen(false)}
        onBuyAll={() => {
          setCartOpen(false);
          router.push('/checkout');
        }}
        actions={
          <Link className="checkout-button" href="/checkout">
            إتمام الطلب <ArrowLeft size={16} />
          </Link>
        }
      />

      {profile.whatsapp ? (
        <a
          className="whatsapp-float"
          onClick={() => trackEvent({ event: 'whatsapp' })}
          href={whatsappHref(profile.whatsapp, `مرحباً، عندي استفسار عن منتجات ${name}.`)}
          target="_blank"
          rel="noreferrer"
          aria-label="تواصل معنا على واتساب"
        >
          <Send size={17} />
          <span>استفسار واتساب</span>
        </a>
      ) : null}

      {toast ? <div className="store-toast" role="status"><span><Check size={14} /></span>{toast}</div> : null}
    </div>
  );
}