'use client';

import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  type BrandProfile,
  type CatalogEntry,
  type InfoPage,
  type Offer,
  type Product,
  type Review,
  type ShippingRate,
  profileDefaults,
} from '@/lib/store';

/* ------------------------------------------------------------------
   Shared Firestore stores
   - one set of listeners per collection for the whole app (not per page)
   - keeps data warm while navigating between routes
   ------------------------------------------------------------------ */

type Listener<T> = (value: T) => void;

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener<T>>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      listeners.forEach((listener) => listener(value));
    },
    update(patch: Partial<T>) {
      value = { ...value, ...patch };
      listeners.forEach((listener) => listener(value));
    },
    subscribe(listener: Listener<T>) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/* ---------------------------------- catalog --------------------------------- */

export type CatalogState = {
  products: Product[];
  categories: CatalogEntry[];
  brands: CatalogEntry[];
  offers: Offer[];
  rates: ShippingRate[];
  profile: BrandProfile;
  loading: boolean;
  dataError: string;
};

const catalog = createStore<CatalogState>({
  products: [],
  categories: [],
  brands: [],
  offers: [],
  rates: [],
  profile: profileDefaults,
  loading: true,
  dataError: '',
});

let catalogStarted = false;

function startCatalog() {
  if (catalogStarted) return;
  catalogStarted = true;
  const publicError = () => catalog.update({ dataError: 'تعذر تحميل بيانات المتجر. تأكد من نشر قواعد Firebase العامة.' });

  const cleanups = [
    onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        catalog.update({
          products: snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Product),
          loading: false,
        });
      },
      () => {
        catalog.update({ dataError: 'تعذر تحميل المنتجات. تأكد من نشر قواعد Firebase العامة.', loading: false });
      },
    ),
    onSnapshot(
      collection(db, 'categories'),
      (snapshot) =>
        catalog.update({
          categories: snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }) as CatalogEntry)
            .filter((item) => item.isActive !== false),
        }),
      publicError,
    ),
    onSnapshot(
      collection(db, 'brands'),
      (snapshot) =>
        catalog.update({
          brands: snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }) as CatalogEntry)
            .filter((item) => item.isActive !== false),
        }),
      publicError,
    ),
    onSnapshot(
      collection(db, 'offers'),
      (snapshot) => catalog.update({ offers: snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Offer) }),
      publicError,
    ),
    onSnapshot(
      query(collection(db, 'shippingRates'), where('isActive', '!=', false)),
      (snapshot) => catalog.update({ rates: snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ShippingRate) }),
      publicError,
    ),
    onSnapshot(
      doc(db, 'workshopSettings', 'main'),
      (snapshot) => catalog.update({ profile: { ...profileDefaults, ...(snapshot.exists() ? snapshot.data() : {}) } }),
      publicError,
    ),
  ];

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => cleanups.forEach((unsubscribe) => unsubscribe()), { once: true });
  }
}

export function subscribeCatalog(listener: Listener<CatalogState>) {
  startCatalog();
  return catalog.subscribe(listener);
}

export function getCatalogSnapshot() {
  startCatalog();
  return catalog.get();
}

/* server snapshots must be referentially stable (React requirement) */
const CATALOG_SERVER_SNAPSHOT: CatalogState = {
  products: [],
  categories: [],
  brands: [],
  offers: [],
  rates: [],
  profile: profileDefaults,
  loading: true,
  dataError: '',
};

export function getCatalogServerSnapshot(): CatalogState {
  return CATALOG_SERVER_SNAPSHOT;
}

/* ---------------------------------- reviews --------------------------------- */

/**
 * ملاحظة: بنفلتر بـ where على status + productId بس (ساوي) من غير orderBy،
 * عشان محتاجش composite index في Firestore — لو الـindex ناقص الـlistener
 * بيقفل وما بيظهرش أي تقييم. الترتيب بيتعمل هنا في العميل.
 */

function byNewest(list: Review[]) {
  const stamp = (value: unknown) => {
    const seconds = (value as { seconds?: number } | undefined)?.seconds;
    return typeof seconds === 'number' ? seconds : 0;
  };
  return [...list].sort((left, right) => stamp(right.createdAt) - stamp(left.createdAt));
}

const reviews = createStore<{ items: Review[]; loading: boolean }>({ items: [], loading: true });
let reviewsStarted = false;

export function subscribeReviews(listener: Listener<{ items: Review[]; loading: boolean }>) {
  if (!reviewsStarted) {
    reviewsStarted = true;
    onSnapshot(
      query(collection(db, 'reviews'), where('status', '==', 'معتمدة'), limit(200)),
      (snapshot) => reviews.set({ items: byNewest(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Review)), loading: false }),
      () => reviews.set({ items: [], loading: false }),
    );
  }
  return reviews.subscribe(listener);
}

export const getReviewsSnapshot = () => reviews.get();
const REVIEWS_SERVER_SNAPSHOT = { items: [] as Review[], loading: true };
export const getReviewsServerSnapshot = () => REVIEWS_SERVER_SNAPSHOT;

/* ------------------------- reviews for a single product ------------------------ */

function createProductReviewsStore(productId: string) {
  const store = createStore<{ items: Review[]; loading: boolean }>({ items: [], loading: true });
  const started = onSnapshot(
    query(collection(db, 'reviews'), where('status', '==', 'معتمدة'), where('productId', '==', productId)),
    (snapshot) => store.set({ items: byNewest(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Review)), loading: false }),
    () => store.set({ items: [], loading: false }),
  );
  if (typeof window !== 'undefined') window.addEventListener('pagehide', () => started(), { once: true });
  return {
    subscribe: store.subscribe,
    get: store.get,
  };
}

const productReviewStores = new Map<string, ReturnType<typeof createProductReviewsStore>>();

export function subscribeProductReviews(productId: string, listener: Listener<{ items: Review[]; loading: boolean }>) {
  if (!productId) {
    listener({ items: [], loading: false });
    return () => undefined;
  }
  let store = productReviewStores.get(productId);
  if (!store) {
    store = createProductReviewsStore(productId);
    productReviewStores.set(productId, store);
  }
  return store.subscribe(listener);
}

export function getProductReviewsSnapshot(productId: string) {
  if (!productId) return EMPTY_PRODUCT_REVIEWS;
  return productReviewStores.get(productId)?.get() ?? EMPTY_PRODUCT_REVIEWS;
}

export function getProductReviewsServerSnapshot() {
  return EMPTY_PRODUCT_REVIEWS;
}

const EMPTY_PRODUCT_REVIEWS: { items: Review[]; loading: boolean } = { items: [], loading: true };

/* ------------------------- blog posts + info pages -------------------------- */

const content = createStore<{ posts: BlogRow[]; pages: InfoPage[]; loading: boolean }>({ posts: [], pages: [], loading: true });
let contentStarted = false;

type BlogRow = { id: string; title: string; slug: string; excerpt?: string; content?: string; coverImage?: string; author?: string; readMinutes?: number; publishedAt?: unknown; tags?: string[]; isPublished?: boolean };

export function subscribeContent(listener: Listener<{ posts: BlogRow[]; pages: InfoPage[]; loading: boolean }>) {
  if (!contentStarted) {
    contentStarted = true;
    const cleanups = [
      onSnapshot(
        query(collection(db, 'blogPosts'), where('isPublished', '==', true), orderBy('publishedAt', 'desc'), limit(60)),
        (snapshot) =>
          content.update({
            posts: snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as BlogRow).filter((post) => post.isPublished !== false),
          }),
        () => undefined,
      ),
      onSnapshot(
        query(collection(db, 'pages'), where('isPublished', '==', true)),
        (snapshot) =>
          content.update({
            pages: snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as InfoPage).filter((entry) => entry.isPublished !== false),
          }),
        () => undefined,
      ),
    ];
    void cleanups;
  }
  return content.subscribe(listener);
}

export const getContentSnapshot = () => content.get();
const CONTENT_SERVER_SNAPSHOT = { posts: [] as BlogRow[], pages: [] as InfoPage[], loading: true };
export const getContentServerSnapshot = () => CONTENT_SERVER_SNAPSHOT;

/* --------------------------- resolve by slug helper ------------------------- */

export function findBySlug<T extends { id: string; slug?: string }>(items: T[], slug: string) {
  return items.find((item) => (item.slug || item.id) === slug) ?? null;
}