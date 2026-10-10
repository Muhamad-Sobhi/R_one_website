'use client';

import { useState } from 'react';
import { Check, ChevronDown, Copy, MessageCircle, Send, Smartphone } from 'lucide-react';
import { useOverlayLock } from '@/lib/hooks';
import { isMobileDevice, launchWhatsApp, whatsappWebLink } from '@/lib/whatsapp';

type WhatsAppPickerProps = {
  open: boolean;
  onClose: () => void;
  /** رقم المتجر — العميل بيوصلنا عليه. */
  phone: string;
  message: string;
  title?: string;
  note?: string;
  onOpened?: () => void;
};

/**
 * على الموبايل بنسلّم الاختيار لنظام التشغيل: ضغطة واحدة بتطلّع قائمة
 * التطبيقات المثبّتة على جهاز العميل (واتساب، واتساب للأعمال، ...).
 * قائمة الروابط بتتحط كحل بديل لو نظام التشغيل رفض يطلّع القائمة.
 */
export default function WhatsAppPicker({ open, onClose, phone, message, title = 'اختر طريقة التواصل', note, onOpened }: WhatsAppPickerProps) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const mobile = typeof window !== 'undefined' && isMobileDevice();

  useOverlayLock(open, onClose);

  if (!open) return null;

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  async function choose() {
    const result = await launchWhatsApp(phone, message);
    if (result === 'intent' || result === 'link') {
      onOpened?.();
      onClose();
    }
    if (result === 'share') {
      onOpened?.();
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="whatsapp-picker" role="dialog" aria-modal="true" aria-labelledby="whatsapp-picker-title">
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">واتساب</span>
            <h2 id="whatsapp-picker-title">{title}</h2>
          </div>
        </div>

        {note ? <p className="customer-gate-note">{note}</p> : null}

        {mobile ? (
          <>
            <button className="whatsapp-open-native" type="button" onClick={choose}>
              <span className="whatsapp-open-icon"><Smartphone size={19} /></span>
              <span className="whatsapp-open-copy">
                <strong>اختار التطبيق اللي عايزه</strong>
                <small>هتطلعلك قائمة التطبيقات المثبتة على موبايلك وتختار منها</small>
              </span>
              <Send size={17} />
            </button>
            <p className="whatsapp-native-note">
              عندك أكتر من نسخة واتساب على الموبايل؟ هيظهرلك كلهم وتختار اللي عايز توصلنا عليه.
            </p>
          </>
        ) : (
          <button className="whatsapp-open-native" type="button" onClick={choose}>
            <span className="whatsapp-open-icon"><MessageCircle size={19} /></span>
            <span className="whatsapp-open-copy">
              <strong>افتح واتساب دلوقتي</strong>
              <small>المتصفح هياخدك على المحادثة</small>
            </span>
            <Send size={17} />
          </button>
        )}

        <button className="whatsapp-copy-button" type="button" onClick={copyMessage}>
          {copied ? <><Check size={15} /> تم نسخ تفاصيل الطلب</> : <><Copy size={15} /> انسخ الطلب والصقه في أي تطبيق</>}
        </button>

        <button className="whatsapp-fallback-toggle" type="button" onClick={() => setShowFallback((value) => !value)} aria-expanded={showFallback}>
          {showFallback ? 'إخفاء الروابط المباشرة' : 'مش فتح؟ جرب رابط مباشر'}
          <ChevronDown size={15} className={showFallback ? 'whatsapp-chevron-open' : ''} />
        </button>

        {showFallback ? (
          <div className="whatsapp-targets">
            <a className="whatsapp-target" href={whatsappWebLink(phone, message)} target="_blank" rel="noreferrer" onClick={() => { onOpened?.(); onClose(); }}>
              <span className="whatsapp-target-icon"><MessageCircle size={17} /></span>
              <span className="whatsapp-target-copy"><strong>واتساب</strong><small>التطبيق العادي</small></span>
              <Send size={16} />
            </a>
            <a className="whatsapp-target" href={`https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, '').replace(/^0/, '20')}${message ? `?text=${encodeURIComponent(message)}` : ''}`} target="_blank" rel="noreferrer" onClick={() => { onOpened?.(); onClose(); }}>
              <span className="whatsapp-target-icon"><MessageCircle size={17} /></span>
              <span className="whatsapp-target-copy"><strong>واتساب للأعمال</strong><small>WhatsApp Business</small></span>
              <Send size={16} />
            </a>
          </div>
        ) : null}
      </section>
    </div>
  );
}