'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Check, Clock3, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react';
import { PageHero, PageSection } from '@/components/page-shell';
import SocialLinks from '@/components/social-links';
import StoreLayout from '@/components/store-layout';
import { useStoreData, useToast } from '@/lib/hooks';
import { brandName, whatsappHref } from '@/lib/store';

export default function ContactPage() {
  const { profile } = useStoreData();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const name = brandName(profile.name);
  const location = [profile.address, profile.city, profile.governorate].filter(Boolean).join('، ');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    const digits = form.phone.replace(/\D/g, '');
    const message = `مرحباً، أنا ${form.name}${digits ? ` (${digits})` : ''}\n${form.message}`;
    setLink(profile.whatsapp ? `${whatsappHref(profile.whatsapp, message)}${whatsappHref(profile.whatsapp).includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}` : `mailto:${profile.email}?subject=${encodeURIComponent('استفسار من الموقع')}&body=${encodeURIComponent(message)}`);
    try {
      await fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'contact', name: form.name, phone: form.phone, email: profile.email, message: form.message, source: 'contact-page' }),
      });
      setSent(true);
      showToast('وصلتنا رسالتك، هنرد عليك قريب.');
    } catch {
      showToast('مقدرناش نحفظ الرسالة، جرّب واتساب.');
    } finally {
      setSending(false);
    }
  }

  return (
    <StoreLayout>
      <PageHero eyebrow="تواصل" title="كلمنا" description="عندك سؤال عن مقاس أو طلب؟ ابعتلنا وهنرد عليك." breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'تواصل' }]} />

      <PageSection>
        <div className="contact-layout">
          <form className="contact-form" onSubmit={submit}>
            <div className="checkout-step">
              <span className="checkout-step-number">1</span>
              <div><strong>بياناتك</strong><small>عشان نرد عليك بسرعة</small></div>
            </div>
            <label>
              الاسم
              <input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="اسمك" />
            </label>
            <label>
              رقم الموبايل <span className="field-optional">اختياري</span>
              <input type="tel" dir="ltr" maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01xxxxxxxxx" />
            </label>
            <label>
              رسالتك
              <textarea rows={5} required minLength={5} maxLength={800} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="اكتب سؤالك أو طلبك..." />
            </label>
            <button className="checkout-button" type="submit" disabled={sending}>{sending ? 'بنحفظ...' : 'أرسل الرسالة'} <Send size={16} /></button>
            {sent ? <p className="contact-sent"><Check size={14} /> وصلتنا رسالتك محفوظة عندنا، ولو تحب رد أسرع ابعت على واتساب.</p> : null}
            {link ? (
              <a className="button-dark" href={link} target="_blank" rel="noreferrer">
                <Check size={16} /> اضغط للإرسال على {profile.whatsapp ? 'واتساب' : 'البريد'}
              </a>
            ) : null}
          </form>

          <aside className="contact-cards">
            {profile.phone ? (
              <a className="contact-card" href={`tel:${profile.phone}`}>
                <span><Phone size={17} /></span>
                <div><small>اتصل بينا</small><strong dir="ltr">{profile.phone}</strong></div>
              </a>
            ) : null}
            {profile.whatsapp ? (
              <a className="contact-card" href={whatsappHref(profile.whatsapp, `مرحباً، عندي استفسار عن منتجات ${name}.`)} target="_blank" rel="noreferrer">
                <span><Send size={17} /></span>
                <div><small>واتساب</small><strong>ابدأ محادثة</strong></div>
              </a>
            ) : null}
            {profile.email ? (
              <a className="contact-card" href={`mailto:${profile.email}`}>
                <span><Mail size={17} /></span>
                <div><small>الإيميل</small><strong dir="ltr">{profile.email}</strong></div>
              </a>
            ) : null}
            {location ? (
              <div className="contact-card">
                <span><MapPin size={17} /></span>
                <div><small>الموقع</small><strong>{location}</strong></div>
              </div>
            ) : null}
            {profile.workingHours ? (
              <div className="contact-card">
                <span><Clock3 size={17} /></span>
                <div><small>مواعيد العمل</small><strong>{profile.workingHours}</strong></div>
              </div>
            ) : null}

            <div className="contact-social">
              <span className="filter-label">تابعنا</span>
              <SocialLinks profile={profile} variant="plain" exclude={['whatsapp']} />
            </div>

            <div className="contact-help">
              <span className="filter-label">روابط مهمة</span>
              <div>
                <Link href="/track-order">تتبع طلبك</Link>
                <Link href="/pages/shipping">الشحن والتوصيل</Link>
                <Link href="/pages/return-policy">الاستبدال والاسترجاع</Link>
                <Link href="/pages/faq">الأسئلة الشائعة</Link>
              </div>
            </div>
          </aside>
        </div>
      </PageSection>
    </StoreLayout>
  );
}
