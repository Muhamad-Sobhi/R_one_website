'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Check, MessageSquarePlus, Star } from 'lucide-react';
import { useToast } from '@/lib/hooks';
import {
  MAX_REVIEW_LENGTH,
  type Product,
  type Review,
  approvedReviews,
  brandName,
  formatDateStamp,
  ratingSummary,
} from '@/lib/store';

type ProductReviewsProps = {
  product: Product;
  productName: string;
  reviews: Review[];
};

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} className={star <= Math.round(value) ? 'star-on' : 'star-off'} fill={star <= Math.round(value) ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export default function ProductReviews({ product, productName, reviews }: ProductReviewsProps) {
  const { showToast } = useToast();
  const productReviews = useMemo(() => approvedReviews(reviews.filter((review) => review.productId === product.id)), [reviews, product.id]);
  const summary = useMemo(() => ratingSummary(productReviews), [productReviews]);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ customerName: '', phone: '', comment: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, productName, rating, ...form }),
      });
      const result = (await response.json()) as { error?: string; reviewId?: string };
      if (!response.ok || !result.reviewId) throw new Error(result.error || 'تعذر حفظ التقييم.');
      setSent(true);
      setForm({ customerName: '', phone: '', comment: '' });
      showToast('تم استلام تقييمك، هيظهر بعد المراجعة.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ التقييم.');
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || rating;

  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-head">
        <div>
          <span className="eyebrow"><i /> تقييمات العملاء</span>
          <h2>اللي قالوه عن القطعة</h2>
        </div>
        <div className="reviews-summary">
          <strong>{summary.count ? summary.average.toFixed(1) : '—'}</strong>
          <div>
            <Stars value={summary.average} size={16} />
            <small>{summary.count ? `${summary.count} تقييم معتمد` : 'لسه مفيش تقييمات'}</small>
          </div>
        </div>
      </div>

      <div className="reviews-layout">
        <div className="reviews-list">
          {productReviews.length ? (
            productReviews.map((review) => (
              <article className="review-item" key={review.id}>
                <div className="review-item-top">
                  <strong>{review.customerName}</strong>
                  <Stars value={Number(review.rating) || 0} />
                  <small>{formatDateStamp(review.createdAt)}</small>
                </div>
                <p>{review.comment}</p>
              </article>
            ))
          ) : (
            <div className="reviews-empty">
              <MessageSquarePlus size={22} />
              <strong>كن أول من يقيّم {brandName()}</strong>
              <p>رأيك بيساعد غيرك يختار قطعته.</p>
            </div>
          )}

          {summary.count ? (
            <div className="reviews-bars">
              {summary.buckets.map((bucket) => (
                <div className="review-bar" key={bucket.star}>
                  <span>{bucket.star} <Star size={10} fill="currentColor" /></span>
                  <i>
                    <b style={{ width: `${summary.count ? (bucket.count / summary.count) * 100 : 0}%` }} />
                  </i>
                  <small>{bucket.count}</small>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <form className="review-form" onSubmit={submit}>
          <div className="review-form-head">
            <Star size={16} />
            <strong>اكتب تقييمك</strong>
          </div>

          <div className="review-stars-input" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={star <= shown ? 'star-on' : 'star-off'}
                onMouseEnter={() => setHover(star)}
                onClick={() => setRating(star)}
                aria-label={`${star} نجوم`}
                aria-pressed={rating === star}
              >
                <Star size={26} fill={star <= shown ? 'currentColor' : 'none'} />
              </button>
            ))}
            <small>{shown === 5 ? 'ممتاز' : shown === 4 ? 'جيد جداً' : shown === 3 ? 'جيد' : shown === 2 ? 'مقبول' : 'ضعيف'}</small>
          </div>

          <label>
            الاسم
            <input required maxLength={60} value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} placeholder="اسمك" />
          </label>
          <label>
            رقم الموبايل <span className="field-optional">اختياري</span>
            <input type="tel" dir="ltr" maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01xxxxxxxxx" />
          </label>
          <label>
            رأيك
            <textarea
              rows={4}
              required
              minLength={5}
              maxLength={MAX_REVIEW_LENGTH}
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
              placeholder="المقاس، الخامة، أو أي حاجة حلوة في القطعة..."
            />
            <small className="review-counter">{form.comment.length} / {MAX_REVIEW_LENGTH}</small>
          </label>

          {error ? <p className="checkout-error" role="alert">{error}</p> : null}
          {sent && !error ? <p className="review-sent"><Check size={14} /> استلمنا تقييمك وبيظهر بعد المراجعة.</p> : null}

          <button className="checkout-button" type="submit" disabled={busy}>
            {busy ? 'جارٍ الإرسال...' : <>أرسل التقييم <Check size={16} /></>}
          </button>
          <p className="checkout-note">التقييمات بتظهر بعد مراجعة الإدارة.</p>
        </form>
      </div>
    </section>
  );
}