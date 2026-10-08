'use client';

import Link from 'next/link';
import { Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, Truck, Undo2 } from 'lucide-react';
import { BrandLockup } from '@/components/brand-logo';
import SocialLinks from '@/components/social-links';
import { type BrandProfile, BRAND_TAGLINE, INFO_PAGES, brandDescription, brandName, brandTagline, socialLink } from '@/lib/store';

type SiteFooterProps = {
  profile: BrandProfile;
};

const TRUST = [
  { icon: Truck, label: 'توصيل لكل المحافظات' },
  { icon: Undo2, label: 'استبدال خلال 14 يوم' },
  { icon: ShieldCheck, label: 'دفع عند الاستلام' },
  { icon: Sparkles, label: 'قطع مختارة' },
];

export default function SiteFooter({ profile }: SiteFooterProps) {
  const location = [profile.address, profile.city, profile.governorate].filter(Boolean).join('، ');
  const name = brandName(profile.name);
  const mapLink = socialLink(profile, 'map');
  const website = socialLink(profile, 'website');
  const whatsapp = socialLink(profile, 'whatsapp');

  return (
    <footer className="site-footer" id="contact">
      <div className="footer-center">
        <Link className="footer-wordmark" href="/" aria-label={`${name} — الرئيسية`}>
          <BrandLockup size={46} variant="ghost" tone="dark" priority />
        </Link>
        <p className="footer-tagline">{brandTagline(profile.tagline)}</p>
        <p className="footer-description">{brandDescription(profile.description)}</p>
        <SocialLinks profile={profile} variant="chip" exclude={['whatsapp', 'map', 'website']} />
      </div>

      <div className="footer-links-grid">
        <nav className="footer-links" aria-label="روابط مهمة">
          <span className="footer-links-title">روابط مهمة</span>
          {INFO_PAGES.map((entry) => (
            <Link href={`/pages/${entry.slug}`} key={entry.slug}>{entry.title}</Link>
          ))}
          <Link href="/shipping-and-payment">الشحن والدفع</Link>
          <Link href="/track-order">تتبع طلبك</Link>
        </nav>

        <nav className="footer-links" aria-label="تسوق">
          <span className="footer-links-title">تسوّق</span>
          <Link href="/products">كل المنتجات</Link>
          <Link href="/categories">الأقسام</Link>
          <Link href="/offers">العروض</Link>
          <Link href="/cart">سلة التسوق</Link>
          <Link href="/blog">المدونة</Link>
          <Link href="/about">عن {name}</Link>
          <Link href="/contact">تواصل معانا</Link>
        </nav>

        <div className="footer-links footer-contact-col">
          <span className="footer-links-title">تواصل</span>
          {whatsapp ? (
            <a
              className="footer-whatsapp"
              href={`${whatsapp.href}?text=${encodeURIComponent(`مرحباً، عندي استفسار عن منتجات ${name}.`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={15} /> واتساب
            </a>
          ) : null}
          {profile.phone ? <a href={`tel:${profile.phone}`}><Phone size={15} /> <span dir="ltr">{profile.phone}</span></a> : null}
          {profile.email ? <a href={`mailto:${profile.email}`}><Mail size={15} /> <span dir="ltr">{profile.email}</span></a> : null}
          {location ? (
            mapLink ? (
              <a href={mapLink.href} target="_blank" rel="noreferrer"><MapPin size={15} /> {location}</a>
            ) : (
              <span className="footer-location"><MapPin size={15} /> {location}</span>
            )
          ) : null}
          {profile.workingHours ? <span className="footer-location"><Clock3 size={15} /> {profile.workingHours}</span> : null}
          {website ? <a href={website.href} target="_blank" rel="noreferrer">{website.label}</a> : null}
        </div>
      </div>

      <div className="footer-trust">
        {TRUST.map((item) => (
          <span key={item.label}><item.icon size={15} /> {item.label}</span>
        ))}
      </div>

      <span className="copyright">© {new Date().getFullYear()} {name} · {BRAND_TAGLINE} · كل الحقوق محفوظة</span>
    </footer>
  );
}