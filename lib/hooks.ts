'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  CART_STORAGE_KEY,
  type BlogPost,
  type BrandProfile,
  type CatalogEntry,
  type CartLine,
  type Offer,
  type InfoPage,
  type Product,
  type Review,
  type ResolvedProduct,
  type ShippingRate,
  profileDefaults,
  resolveCatalog,
  todayStamp,
} from '@/lib/store';

export function useStoreData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogEntry[]>([]);
  const [brands, setBrands] = useState<CatalogEntry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [infoPages, setInfoPages] = useState<InfoPage[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [profile, setProfile] = useState<BrandProfile>(profileDefaults);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    const publicError = () => setDataError('تعذر تحميل بيانات المتجر. تأكد من نشر قواعد Firebase العامة.');
    const cleanups = [
      onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Product));
          setLoading(false);
        },
        () => {
          setDataError('تعذر تحميل المنتجات. تأكد من نشر قواعد Firebase العامة.');
          setLoading(false);
        },
      ),
      onSnapshot(collection(db, 'categories'), (snapshot) => setCategories(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CatalogEntry).filter((item) => item.isActive !== false)), publicError),
      onSnapshot(collection(db, 'brands'), (snapshot) => setBrands(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CatalogEntry).filter((item) => item.isActive !== false)), publicError),
      onSnapshot(collection(db, 'offers'), (snapshot) => setOffers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Offer)), publicError),
      onSnapshot(collection(db, 'shippingRates'), (snapshot) => setRates(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ShippingRate).filter((item) => item.isActive !== false)), publicError),
      onSnapshot(doc(db, 'workshopSettings', 'main'), (snapshot) => setProfile({ ...profileDefaults, ...(snapshot.exists() ? snapshot.data() : {}) }), publicError),
      onSnapshot(
        collection(db, 'blogPosts'),
        (snapshot) => setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as BlogPost).filter((post) => post.isPublished !== false)),
        () => setPosts([]),
      ),
      onSnapshot(
        collection(db, 'pages'),
        (snapshot) => setInfoPages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as InfoPage).filter((entry) => entry.isPublished !== false)),
        () => setInfoPages([]),
      ),
      onSnapshot(
        collection(db, 'reviews'),
        (snapshot) => {
          const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Review);
          setReviews(list.filter((review) => review.status === 'معتمدة'));
        },
        () => setReviews([]),
      ),
    ];
    return () => cleanups.forEach((unsubscribe) => unsubscribe());
  }, []);

  const today = todayStamp();
  const catalog = useMemo(() => resolveCatalog(products, offers, today, categories, brands), [products, offers, today, categories, brands]);
  const available = useMemo(() => catalog.filter((product) => Number(product.stock) > 0), [catalog]);

  return { products, catalog, available, categories, brands, offers, rates, reviews, posts, infoPages, profile, loading, dataError, today };
}

export function useCart(products: Product[]) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartLine[];
        if (Array.isArray(parsed)) {
          setLines(
            parsed.filter(
              (line) => line && typeof line.productId === 'string' && Number.isInteger(line.quantity) && line.quantity > 0,
            ),
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

  const changeQuantity = useCallback(
    (productId: string, quantity: number) => {
      const stock = Number(products.find((item) => item.id === productId)?.stock) || 0;
      const next = Math.min(20, stock, Math.max(0, Math.floor(quantity)));
      setLines((current) =>
        next === 0
          ? current.filter((line) => line.productId !== productId)
          : current.some((line) => line.productId === productId)
            ? current.map((line) => (line.productId === productId ? { ...line, quantity: next } : line))
            : [...current, { productId, quantity: next }],
      );
      return next;
    },
    [products],
  );

  const addOne = useCallback(
    (productId: string) => {
      const existing = lines.find((line) => line.productId === productId)?.quantity || 0;
      const stock = Number(products.find((item) => item.id === productId)?.stock) || 0;
      if (existing >= Math.min(20, stock)) return false;
      changeQuantity(productId, existing + 1);
      return true;
    },
    [changeQuantity, lines, products],
  );

  const bump = useCallback(
    (productId: string, delta: number) => {
      const existing = lines.find((line) => line.productId === productId)?.quantity || 0;
      changeQuantity(productId, existing + delta);
    },
    [changeQuantity, lines],
  );

  const clear = useCallback(() => setLines([]), []);

  return { lines, ready, changeQuantity, addOne, bump, clear };
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
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);
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