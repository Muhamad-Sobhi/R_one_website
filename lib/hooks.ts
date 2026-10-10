'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  type InfoPage,
  type Product,
  type ResolvedProduct,
  type Review,
  resolveCatalog,
  todayStamp,
} from '@/lib/store';
import { bindCartProducts, cartActions, useCartLines } from '@/lib/cart-store';
import {
  getCatalogServerSnapshot,
  getCatalogSnapshot,
  getContentServerSnapshot,
  getContentSnapshot,
  getProductReviewsServerSnapshot,
  getProductReviewsSnapshot,
  getReviewsServerSnapshot,
  getReviewsSnapshot,
  subscribeCatalog,
  subscribeContent,
  subscribeProductReviews,
  subscribeReviews,
} from '@/lib/store-cache';

export function useStoreData() {
  const state = useSyncExternalStore(subscribeCatalog, getCatalogSnapshot, getCatalogServerSnapshot);

  const today = todayStamp();
  const catalog = useMemo(
    () => resolveCatalog(state.products, state.offers, today, state.categories, state.brands),
    [state.products, state.offers, today, state.categories, state.brands],
  );
  const available = useMemo(() => catalog.filter((product) => Number(product.stock) > 0), [catalog]);

  return {
    products: state.products,
    catalog,
    available,
    categories: state.categories,
    brands: state.brands,
    offers: state.offers,
    rates: state.rates,
    profile: state.profile,
    loading: state.loading,
    dataError: state.dataError,
    today,
  };
}

export function useApprovedReviews() {
  const state = useSyncExternalStore(subscribeReviews, getReviewsSnapshot, getReviewsServerSnapshot);
  return state.items as Review[];
}

/** تقييمات منتج واحد — بتتحدّث لحظي أول ما الأدمن يعتمد التقييم. */
export function useProductReviews(productId: string | undefined) {
  const id = productId ?? '';
  const subscribe = useCallback((listener: () => void) => subscribeProductReviews(id, listener), [id]);
  const snapshot = useCallback(() => getProductReviewsSnapshot(id), [id]);
  const server = useCallback(() => getProductReviewsServerSnapshot(), []);
  const state = useSyncExternalStore(subscribe, snapshot, server);
  return state.items as Review[];
}

export function useContent() {
  const state = useSyncExternalStore(subscribeContent, getContentSnapshot, getContentServerSnapshot);
  return { posts: state.posts, infoPages: state.pages as InfoPage[], loading: state.loading };
}

export function useCart(products: Product[]) {
  bindCartProducts(products);
  const state = useCartLines();
  const lines = state.lines;
  const ready = state.ready;

  const changeQuantity = useCallback((productId: string, quantity: number) => cartActions.changeQuantity(productId, quantity), []);
  const changeVariant = useCallback(
    (productId: string, size: string | undefined, color: string | undefined, quantity: number) =>
      cartActions.changeVariant(productId, size, color, quantity),
    [],
  );
  const addOne = useCallback((productId: string) => cartActions.addOne(productId), []);
  const clear = useCallback(() => cartActions.clear(), []);

  return { lines, ready, changeQuantity, changeVariant, addOne, clear };
}

export function useToast(timeout = 2600) {
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), timeout);
    return () => window.clearTimeout(timer);
  }, [toast, timeout]);
  return { toast, showToast: setToast };
}

export function useOverlayLock(open: boolean, onClose?: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
}

export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function cartSummary(items: Array<ResolvedProduct & { quantity: number }>) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  return { count, subtotal };
}