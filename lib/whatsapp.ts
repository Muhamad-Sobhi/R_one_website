'use client';

/**
 * فتح واتساب على الموبايل:
 * - Android: بنستخدم intent scheme — النظام نفسه بيطلّع قائمةApps
 *   (كل نسخ واتساب المثبّتة) والعميل يختار بنفسه.
 * - iOS: Share Sheet بتاعة النظام، والعميل بيختار من كل التطبيقات المثبّتة.
 * - Desktop/m fallback: رابط wa.me مباشر.
 */

const isBrowser = () => typeof window !== 'undefined';

export function isAndroidDevice() {
  if (!isBrowser()) return false;
  return /android/i.test(navigator.userAgent);
}

export function isTouchDevice() {
  if (!isBrowser()) return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

export function isMobileDevice() {
  return isTouchDevice() || isAndroidDevice() || /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function whatsappDigits(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('00') ? digits.slice(2) : digits.startsWith('0') ? `20${digits.slice(1)}` : digits;
}

export function whatsappWebLink(phone: string, message?: string) {
  const international = whatsappDigits(phone);
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${international}${query}`;
}

/** Android intent بيفتح قائمة اختيار التطبيق لكل نسخ واتساب المثبّتة. */
function whatsappIntent(phone: string, message: string) {
  const international = whatsappDigits(phone);
  const fallback = encodeURIComponent(whatsappWebLink(phone, message));
  const params = new URLSearchParams();
  if (international) params.set('phone', international);
  if (message) params.set('text', message);
  params.set('v', '1');
  // sbp =Strict Box Package: يمنع النظام من فتح نسخة واحدة تلقائي
  // وبيرسم chooser بكل التطبيقات اللي بتتسجل على الـ scheme.
  params.set('sbp', 'true');
  return `intent://send?${params.toString()}#Intent;scheme=whatsapp;S.browser_fallback_url=${fallback};end`;
}

export type LaunchResult = 'intent' | 'share' | 'link' | 'failed';

/**
 * بيحاول يفتح واتساب بأعلى طريقة مدعومة على الجهاز الحالي.
 * على الموبايل ده معناه إن النظام هو اللي بيعرض قائمة اختيار التطبيق.
 */
export async function launchWhatsApp(phone: string, message: string): Promise<LaunchResult> {
  if (!isBrowser()) return 'failed';

  if (isAndroidDevice()) {
    window.location.href = whatsappIntent(phone, message);
    return 'intent';
  }

  if (isTouchDevice() && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'R/ONE', text: message });
      return 'share';
    } catch (error) {
      // المستخدم قفل الشيت — بيرجع للموقع ويكمّل عادي
      if (error instanceof DOMException && error.name === 'AbortError') return 'share';
    }
  }

  if (typeof navigator.share === 'function' && !isTouchDevice()) {
    try {
      await navigator.share({ title: 'R/ONE', text: message });
      return 'share';
    } catch {
      /* fallback تحت */
    }
  }

  window.open(whatsappWebLink(phone, message), '_blank', 'noreferrer');
  return 'link';
}