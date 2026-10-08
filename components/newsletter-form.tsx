'use client';

import { useState, type FormEvent } from 'react';
import { Check, Mail, Send } from 'lucide-react';

type NewsletterFormProps = {
  title?: string;
  description?: string;
};

export default function NewsletterForm({ title = 'اشترك في النشرة', description = 'هنبعتلك كل جديد وعروض أول برة، من غير إزعاج.' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'تعذر الاشتراك.');
      setMessage(result.message ?? 'تم الاشتراك.');
      setEmail('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر الاشتراك.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="newsletter">
      <div className="newsletter-copy">
        <span className="eyebrow"><i /> النشرة الإخبارية</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <form className="newsletter-form" onSubmit={submit}>
        <div className="newsletter-field">
          <Mail size={17} />
          <input
            type="email"
            required
            dir="ltr"
            maxLength={120}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="بريدك الإلكتروني"
            aria-label="بريدك الإلكتروني"
          />
        </div>
        <button className="button-dark" type="submit" disabled={busy}>
          {busy ? 'بنشترك...' : <>اشترك <Send size={15} /></>}
        </button>
        {message ? <p className="newsletter-note newsletter-ok"><Check size={14} /> {message}</p> : null}
        {error ? <p className="newsletter-note newsletter-error">{error}</p> : null}
      </form>
    </div>
  );
}