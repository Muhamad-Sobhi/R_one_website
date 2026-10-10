'use client';

import { useSyncExternalStore } from 'react';
import { CART_STORAGE_KEY, MAX_QUANTITY, type CartLine, type Product } from '@/lib/store';

/* ------------------------------------------------------------------
   Shared cart store
   - one cart for the whole tab: product cards, the header drawer and
     the /cart page all read and write the same lines
   - persisted in localStorage under CART_STORAGE_KEY
   ------------------------------------------------------------------ */

type CartState = { lines: CartLine[]; ready: boolean };

const EMPTY_STATE: CartState = { lines: [], ready: false };

let state: CartState = EMPTY_STATE;
let productsRef: Product[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function commit(next: CartLine[], persist = true) {
  state = { lines: next, ready: true };
  if (persist && typeof window !== 'undefined') {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — the cart still works for this session */
    }
  }
  emit();
}

function hydrate() {
  if (state.ready || typeof window === 'undefined') return;
  let saved: CartLine[] = [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartLine[];
      if (Array.isArray(parsed)) {
        saved = parsed.filter((line) => line && typeof line.productId === 'string' && Number.isInteger(line.quantity) && line.quantity > 0);
      }
    }
  } catch {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  state = { lines: saved, ready: true };
  emit();
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY_STATE;

/** Keeps stock clamping in sync with whatever page mounted the hook. */
export function bindCartProducts(products: Product[]) {
  productsRef = products;
}

function stockOf(productId: string) {
  return Number(productsRef.find((item) => item.id === productId)?.stock) || 0;
}

function clamp(productId: string, quantity: number) {
  return Math.min(MAX_QUANTITY, stockOf(productId), Math.max(0, Math.floor(quantity)));
}

const sameLine = (line: CartLine, productId: string, size?: string, color?: string) =>
  line.productId === productId && (line.size ?? '') === (size ?? '') && (line.color ?? '') === (color ?? '');

/** Variant-aware add — the one product cards and quick buy should use. */
function changeVariant(productId: string, size: string | undefined, color: string | undefined, quantity: number) {
  const next = clamp(productId, quantity);
  const current = state.lines;
  if (next === 0) {
    commit(current.filter((line) => !sameLine(line, productId, size, color)));
    return 0;
  }
  const index = current.findIndex((line) => sameLine(line, productId, size, color));
  if (index < 0) {
    commit([...current, { productId, quantity: next, size, color }]);
  } else {
    commit(current.map((line, position) => (position === index ? { ...line, quantity: next } : line)));
  }
  return next;
}

/** Legacy variant-blind quantity change, kept for the cart page and drawer rows. */
function changeQuantity(productId: string, quantity: number) {
  const next = clamp(productId, quantity);
  const current = state.lines;
  if (next === 0) {
    commit(current.filter((line) => line.productId !== productId));
    return 0;
  }
  if (current.some((line) => line.productId === productId)) {
    commit(current.map((line) => (line.productId === productId ? { ...line, quantity: next } : line)));
  } else {
    commit([...current, { productId, quantity: next }]);
  }
  return next;
}

function addOne(productId: string) {
  const existing = state.lines.find((line) => line.productId === productId)?.quantity || 0;
  if (existing >= Math.min(MAX_QUANTITY, stockOf(productId))) return false;
  changeQuantity(productId, existing + 1);
  return true;
}

function clear() {
  commit([]);
}

function syncAcrossTabs() {
  if (typeof window === 'undefined') return;
  window.addEventListener('storage', (event) => {
    if (event.key !== CART_STORAGE_KEY) return;
    try {
      const parsed = JSON.parse(event.newValue || '[]') as CartLine[];
      state = { lines: Array.isArray(parsed) ? parsed : [], ready: true };
      emit();
    } catch {
      /* ignore malformed cross-tab payloads */
    }
  });
}

let storageSyncStarted = false;
function ensureStorageSync() {
  if (storageSyncStarted || typeof window === 'undefined') return;
  storageSyncStarted = true;
  syncAcrossTabs();
}

export function useCartLines() {
  ensureStorageSync();
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const cartActions = { changeVariant, changeQuantity, addOne, clear };