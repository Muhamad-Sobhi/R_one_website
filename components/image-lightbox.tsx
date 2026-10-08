'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useOverlayLock } from '@/lib/hooks';

type ImageLightboxProps = {
  images: string[];
  index: number;
  alt: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export default function ImageLightbox({ images, index, alt, onIndexChange, onClose }: ImageLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const total = images.length;

  useOverlayLock(true, onClose);

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setZoomed(false);
      onIndexChange((index + delta + total) % total);
    },
    [index, onIndexChange, total],
  );

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') go(1);
      if (event.key === 'ArrowRight') go(-1);
      if (event.key === '+' || event.key === '=') setZoomed((value) => value || true);
      if (event.key === '-') setZoomed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [go]);

  if (!total) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`معاينة صور ${alt}`}>
      <div
        className="lightbox-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className={`lightbox-stage ${zoomed ? 'lightbox-zoomed' : ''}`}>
          <Image
            key={images[index]}
            src={images[index]}
            alt={`${alt} — صورة ${index + 1}`}
            width={2000}
            height={2000}
            sizes="100vw"
            quality={92}
            priority
            className="lightbox-image"
            draggable={false}
          />
        </div>

        <div className="lightbox-bar">
          <span className="lightbox-counter">
            {total > 1 ? `${index + 1} / ${total}` : alt}
          </span>
          <div className="lightbox-tools">
            <button type="button" onClick={() => setZoomed((value) => !value)} title={zoomed ? 'تصغير' : 'تكبير'} aria-label={zoomed ? 'تصغير الصورة' : 'تكبير الصورة'}>
              {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
            </button>
            <button type="button" onClick={onClose} title="إغلاق" aria-label="إغلاق المعاينة" ref={closeRef}>
              <X size={18} />
            </button>
          </div>
        </div>

        {total > 1 ? (
          <>
            <button className="lightbox-nav lightbox-prev" type="button" onClick={() => go(-1)} aria-label="الصورة السابقة">
              <ChevronRight size={22} />
            </button>
            <button className="lightbox-nav lightbox-next" type="button" onClick={() => go(1)} aria-label="الصورة التالية">
              <ChevronLeft size={22} />
            </button>
          </>
        ) : null}

        {zoomed ? (
          <span className="lightbox-hint"><Maximize2 size={13} /> الصورة بالحجم الكامل · استخدم العجلة أو +-</span>
        ) : null}
        {total > 1 ? <span className="lightbox-hint lightbox-hint-nav">استخدم ← → للتنقل</span> : null}
      </div>
    </div>
  );
}