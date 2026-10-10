'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { NotFoundBlock, PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useContent } from '@/lib/hooks';
import { formatDateStamp } from '@/lib/store';

export default function BlogPage() {
  const { posts } = useContent();
  const sorted = [...posts].sort((left, right) => (Number(right.publishedAt) || 0) - (Number(left.publishedAt) || 0));
  const [lead, ...rest] = sorted;

  return (
    <StoreLayout>
      <PageHero eyebrow="المدونة" title="أفكار ومحتوى" description="نصائح للستايل، تفاصيل عن القطع، وأخبار المجموعة." breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'المدونة' }]} />

      <PageSection>
        {lead ? (
          <Link className="post-lead" href={`/blog/${lead.slug || lead.id}`}>
            <div className="post-lead-media">
              {lead.coverImage ? <Image src={lead.coverImage} alt={lead.title} fill sizes="(max-width: 900px) 92vw, 48vw" /> : <div className="product-placeholder"><span>R/</span><b>ONE</b></div>}
            </div>
            <div className="post-lead-copy">
              <span className="eyebrow">مقال مميز</span>
              <h2>{lead.title}</h2>
              {lead.excerpt ? <p>{lead.excerpt}</p> : null}
              <span className="post-meta"><CalendarDays size={14} /> {formatDateStamp(lead.publishedAt)}</span>
              <span className="post-read">اقرأ المقال <ArrowLeft size={15} /></span>
            </div>
          </Link>
        ) : (
          <NotFoundBlock title="لسه مفيش مقالات" body="أول ما ننشر أول مقال هيبان هنا." />
        )}
      </PageSection>

      {rest.length ? (
        <PageSection>
          <div className="post-grid">
            {rest.map((post) => (
              <Link className="post-card" href={`/blog/${post.slug || post.id}`} key={post.id}>
                <div className="post-card-media">
                  {post.coverImage ? <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 700px) 92vw, 28vw" /> : <div className="product-placeholder"><span>R/</span><b>ONE</b></div>}
                </div>
                <div className="post-card-copy">
                  <span className="post-meta"><CalendarDays size={13} /> {formatDateStamp(post.publishedAt)}</span>
                  <h3>{post.title}</h3>
                  {post.excerpt ? <p>{post.excerpt}</p> : null}
                  <span className="post-read">اقرأ <ArrowLeft size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        </PageSection>
      ) : null}
    </StoreLayout>
  );
}
