'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import BrandLogo from '@/components/brand-logo';

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
  children: React.ReactNode;
  aside?: React.ReactNode;
};

export function PageHero({ eyebrow, title, description, breadcrumb }: Omit<PageShellProps, 'children' | 'aside'>) {
  return (
    <div className="page-hero">
      <div className="page-hero-inner">
        {breadcrumb?.length ? (
          <nav className="page-breadcrumb" aria-label="مسار التنقل">
            {breadcrumb.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`}>
                {index ? <ChevronLeft size={13} /> : null}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <b>{crumb.label}</b>}
              </span>
            ))}
          </nav>
        ) : null}
        {eyebrow ? <span className="eyebrow"><i /> {eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}

export function PageSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`page-section ${className}`.trim()}>{children}</section>;
}

export function NotFoundBlock({ title = 'الصفحة مش موجودة', body = 'الرابط اتغير أو اتشال. جرّب ترجع للرئيسية أو تشوف كل القطع.' }: { title?: string; body?: string }) {
  return (
    <div className="product-page-notfound">
      <BrandLogo size={54} variant="ghost" />
      <h2>{title}</h2>
      <p>{body}</p>
      <Link href="/products" className="button-dark">تصفح القطع</Link>
    </div>
  );
}