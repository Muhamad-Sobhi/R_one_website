'use client';

import { useEffect, useRef } from 'react';

type TrackEvent =
  | { event: 'view'; productId: string; productName: string }
  | { event: 'add_to_cart'; productId: string; productName: string }
  | { event: 'search'; query: string; results: number; source?: string }
  | { event: 'contact'; name: string; phone?: string; email?: string; message: string }
  | { event: 'whatsapp' }
  | { event: 'checkout_start' };

const queue: TrackEvent[] = [];
let flushTimer: number | undefined;

/** Fire-and-forget analytics: batched, never blocks the UI, never throws. */
export function trackEvent(payload: TrackEvent) {
  if (typeof window === 'undefined') return;
  queue.push(payload);
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    const batch = queue.splice(0, queue.length);
    flushTimer = undefined;
    const body = JSON.stringify(batch.length === 1 ? batch[0] : batch);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track-event', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/track-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
  }, 1200);
}

/** Tracks a product view once per mount (and once per id change). */
export function useTrackView(productId: string | undefined, productName: string | undefined) {
  const lastRef = useRef<string>('');
  useEffect(() => {
    if (!productId || lastRef.current === productId) return;
    lastRef.current = productId;
    trackEvent({ event: 'view', productId, productName: productName ?? '' });
  }, [productId, productName]);
}

/** Logs a search term once the user stops typing for a moment. */
export function useTrackSearch(term: string, results: number, enabled = true) {
  const lastRef = useRef<string>('');
  useEffect(() => {
    const value = term.trim();
    if (!enabled || value.length < 2 || lastRef.current === value) return;
    const timer = window.setTimeout(() => {
      lastRef.current = value;
      trackEvent({ event: 'search', query: value, results, source: 'storefront' });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [term, results, enabled]);
}