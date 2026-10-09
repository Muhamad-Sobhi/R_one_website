'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useOverlayLock } from '@/lib/hooks';

const STORAGE_KEY = 'r-one-customer';

export type CustomerProfile = { name: string; phone: string; email: string; city: string; address: string };

export function readCustomer(): CustomerProfile {
  if (typeof window === 'undefined') return { name: '', phone: '', email: '', city: '', address: '' };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<CustomerProfile>;
    return { name: saved.name ?? '', phone: saved.phone ?? '', email: saved.email ?? '', city: saved.city ?? '', address: saved.address ?? '' };
  } catch {
    return { name: '', phone: '', email: '', city: '', address: '' };
  }
}

function saveCustomer(profile: CustomerProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable — not critical */
  }
}

type CustomerGateProps = {
  open: boolean;
  onClose: () => void;
  onVerified: (profile: CustomerProfile) => void;
  reason?: string;
};

/**
 * Gate before handing the customer over to WhatsApp:
 * we register them in Firestore (customers collection) first.
 */
export default function CustomerGate({ open, onClose, onVerified, reason }: CustomerGateProps) {
  const [form, setForm] = useState<CustomerProfile>({ name: '', phone: '', email: '', city: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [known, setKnown] = useState(false);

  useOverlayLock(open, onClose);

  useEffect(() => {
    if (!open) return;
    const saved = readCustomer();
    setForm(saved);
    setKnown(Boolean(saved.name && saved.phone));
    setError('');
  }, [open]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'تعذر حفظ بياناتك.');
      saveCustomer(form);
      onVerified(form);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ بياناتك.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="customer-gate" role="dialog" aria-modal="true" aria-labelledby="customer-gate-title">
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">بياناتك</span>
            <h2 id="customer-gate-title">من فضلك سجّل بياناتك</h2>
          </div>
          <button className="icon-button" type="button" title="إغلاق" aria-label="إغلاق" onClick={onClose}><X size={19} /></button>
        </div>

        <p className="customer-gate-note">
          {reason || 'بنحفظ بياناتك عشان نجهّز طلبك على واتساب وتتابع معاك لحد ما يوصلك.'}
        </p>

        <form className="checkout-form" onSubmit={submit}>
          <label>
            الاسم بالكامل
            <input required maxLength={100} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="اكتب اسمك" />
          </label>
          <label>
            رقم الموبايل
            <input required type="tel" dir="ltr" minLength={8} maxLength={30} autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01xxxxxxxxx" />
          </label>
          <label>
            العنوان <span className="field-optional">اختياري</span>
            <input maxLength={240} autoComplete="street-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="المحافظة والمدينة والشارع" />
          </label>

          {error ? <p className="checkout-error" role="alert">{error}</p> : null}
          {known ? <p className="customer-gate-known"><Check size={13} /> بياناتك محفوظة على هذا الجهاز من قبل.</p> : null}

          <button className="checkout-button" type="submit" disabled={busy}>
            {busy ? 'بنحفظ بياناتك...' : <>حفظ ومتابعة لواتساب <Check size={16} /></>}
          </button>
          <p className="checkout-note"><UserPlus size={12} /> بنسجّل بياناتك في قائمة عملائنا عشان نتابع طلبك.</p>
          <p className="checkout-note"><ShieldCheck size={12} /> بياناتك متحفوظة وبتستخدم فقط لتوصيل الطلب.</p>
        </form>
      </section>
    </div>
  );
}
