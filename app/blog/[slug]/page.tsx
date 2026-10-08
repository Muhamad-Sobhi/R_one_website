'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarDays, ChevronLeft } from 'lucide-react';
import { NotFoundBlock, PageHero, PageSection } from '@/components/page-shell';
import StoreLayout from '@/components/store-layout';
import { useStoreData } from '@/lib/hooks';
import { formatDateStamp } from '@/lib/store';

export default function BlogPostPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { posts } = useStoreData();
  const post = posts.find((entry) => (entry.slug || entry.id) === slug) ?? null;
  const related = posts.filter((entry) => entry.id !== post?.id).slice(0, 3);

  if (!post) {
    return (
      <StoreLayout>
        <NotFoundBlock title="المقال مش موجود" body="يمكن المقال اتشال أو الرابط اتغير." />
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <PageHero
        eyebrow="المدونة"
        title={post.title}
        description={post.excerpt}
        breadcrumb={[{ label: 'الرئيسية', href: '/' }, { label: 'المدونة', href: '/blog' }, { label: post.title }]}
      />

      <article className="post-article">
        {post.coverImage ? (
          <div className="post-cover"><Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 900px) 100vw, 900px" priority /></div>
        ) : null}
        <div className="post-article-meta">
          <span><CalendarDays size={14} /> {formatDateStamp(post.publishedAt)}</span>
          {post.author ? <span>بقلم {post.author}</span> : null}
          {post.readMinutes ? <span>{post.readMinutes} دقائق قراءة</span> : null}
        </div>
        <div className="post-article-body">
          {(post.content ?? post.excerpt ?? '').split('\n').map((line, index) => (line.trim() ? <p key={index}>{line}</p> : <span className="post-gap" key={index} />))}
        </div>
        <Link className="button-dark" href="/blog">رجوع للمدونة <ChevronLeft size={16} /></Link>
      </article>

      {related.length ? (
        <PageSection>
          <div className="post-grid">
            {related.map((entry) => (
              <Link className="post-card" href={`/blog/${entry.slug || entry.id}`} key={entry.id}>
                <div className="post-card-media">
                  {entry.coverImage ? <Image src={entry.coverImage} alt={entry.title} fill sizes="(max-width: 700px) 100vw, 33vw" /> : <div className="product-placeholder"><span>R/</span><b>ONE</b></div>}
                </div>
                <div className="post-card-copy">
                  <h3>{entry.title}</h3>
                  {entry.excerpt ? <p>{entry.excerpt}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        </PageSection>
      ) : null}
    </StoreLayout>
  );
}
