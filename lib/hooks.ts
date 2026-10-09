'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  CART_STORAGE_KEY,
  type CartLine,
  type InfoPage,
  type Product,
  type ResolvedProduct,
  type Review,
  resolveCatalog,
  todayStamp,
} from '@/lib/store';
import {
  getCatalogServerSnapshot,
  getCatalogSnapshot,
  getContentServerSnapshot,
  getContentSnapshot,
  getReviewsServerSnapshot,
  getReviewsSnapshot,
  subscribeCatalog,
  subscribeContent,
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

export function useContent() {
  const state = useSyncExternalStore(subscribeContent, getContentSnapshot, getContentServerSnapshot);
  return { posts: state.posts, infoPages: state.pages as InfoPage[], loading: state.loading };
}

export function useCart(products: Product[]) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const productsRef = useRef(products);
  productsRef.current = products;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartLine[];
        if (Array.isArray(parsed)) {
          setLines(
            parsed.filter((line) => line && typeof line.productId === 'string' && Number.isInteger(line.quantity) && line.quantity > 0),
          );
        }
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const changeQuantity = useCallback((productId: string, quantity: number) => {
    const stock = Number(productsRef.current.find((item) => item.id === productId)?.stock) || 0;
    const next = Math.min(20, stock, Math.max(0, Math.floor(quantity)));
    setLines((current) =>
      next === 0
        ? current.filter((line) => line.productId !== productId)
        : current.some((line) => line.productId === productId)
          ? current.map((line) => (line.productId === productId ? { ...line, quantity: next } : line))
          : [...current, { productId, quantity: next }],
    );
    return next;
  }, []);

  const changeVariant = useCallback(
    (productId: string, size: string | undefined, color: string | undefined, quantity: number) => {
      const stock = Number(productsRef.current.find((item) => item.id === productId)?.stock) || 0;
      const next = Math.min(20, stock, Math.max(0, Math.floor(quantity)));
      setLines((current) => {
        const index = current.findIndex(
          (line) => line.productId === productId && (line.size ?? '') === (size ?? '') && (line.color ?? '') === (color ?? ''),
        );
        if (next === 0) return current.filter((_, position) => position !== index);
        if (index < 0) return [...current, { productId, quantity: next, size, color }];
        return current.map((line, position) => (position === index ? { ...line, quantity: next } : line));
      });
      return next;
    },
    [],
  );

  const addOne = useCallback(
    (productId: string) => {
      const existing = lines.find((line) => line.productId === productId)?.quantity || 0;
      const stock = Number(productsRef.current.find((item) => item.id === productId)?.stock) || 0;
      if (existing >= Math.min(20, stock)) return false;
      changeQuantity(productId, existing + 1);
      return true;
    },
    [changeQuantity, lines],
  );

  const clear = useCallback(() => setLines([]), []);

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