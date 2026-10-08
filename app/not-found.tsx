import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { MAIN_LINKS } from '@/lib/store';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1>الصفحة دي مش موجودة</h1>
        <p>الرابط اتغير أو الصفحة اتشالت. جرّب تكمل من أي مكان في الموقع.</p>
        <div className="not-found-actions">
          <Link className="button-dark" href="/"><Home size={16} /> الرئيسية</Link>
          <Link className="button-dark button-ghost" href="/products"><Search size={16} /> تصفح المنتجات</Link>
        </div>
        <nav className="not-found-links" aria-label="روابط سريعة">
          {MAIN_LINKS.map((link) => <Link href={link.href} key={link.href}>{link.label} <ArrowLeft size={13} /></Link>)}
        </nav>
      </div>
    </main>
  );
}
