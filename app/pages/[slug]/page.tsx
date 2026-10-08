'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { NotFoundBlock, PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { INFO_PAGES, brandTagline, formatDateStamp } from '@/lib/store';

export default function InfoPageView() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { infoPages, profile } = useStoreData();
  const stored = infoPages.find((entry) => (entry.slug || entry.id) === slug) ?? null;
  const fallback = INFO_PAGES.find((entry) => entry.slug === slug) ?? null;
  const page = stored ?? fallback;

  if (!page) {
    return (
      <StoreLayout>
        <NotFoundBlock title="الصفحة مش موجودة" body="الرابط اتغير أو الصفحة اتشالت." />
      </StoreLayout>
    );
  }

  const content = (stored?.content ?? fallback?.fallback ?? '').trim();

  return (
    <StoreLayout>
      <PageHero
        eyebrow={page.title}
        title={page.title}
        description={brandTagline(profile.tagline)}
        breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: page.title }]}
      />

      <PageSection>
        <div className="info-page-layout">
          <article className="info-article">
            <div className="info-article-body">
              {content.split('\n').map((line, index) => (line.trim() ? <p key={index}>{line}</p> : <span className="post-gap" key={index} />))}
            </div>
            {stored?.updatedAt ? <span className="info-updated">آخر تحديث: {formatDateStamp(stored.updatedAt)}</span> : null}
            <Link className="button-dark" href="/contact">كلمنا لو عندك سؤال</Link>
          </article>

          <aside className="info-side">
            <span className="filter-label">روابط مهمة</span>
            <nav>
              {INFO_PAGES.map((entry) => (
                <Link className={entry.slug === slug ? 'info-side-active' : ''} href={`/pages/${entry.slug}`} key={entry.slug}>
                  {entry.title}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      </PageSection>
    </StoreLayout>
  );
}
