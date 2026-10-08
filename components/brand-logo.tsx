'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { BRAND_NAME, LOGO_SRC } from '@/lib/store';

type BrandLogoProps = {
  size?: number;
  variant?: 'ink' | 'paper' | 'ghost';
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({ size = 40, variant = 'ink', className = '', priority = false }: BrandLogoProps) {
  return (
    <span
      className={`brand-logo brand-logo-${variant} ${className}`.trim()}
      style={{ '--logo-size': `${size}px` } as CSSProperties}
    >
      <Image
        src={LOGO_SRC}
        alt={BRAND_NAME}
        width={size}
        height={size}
        priority={priority}
        className="brand-logo-img"
        draggable={false}
      />
    </span>
  );
}

type BrandWordProps = {
  className?: string;
};

export function BrandWord({ className = '' }: BrandWordProps) {
  return (
    <span className={`brand-word ${className}`.trim()} dir="ltr">
      <i className="brand-word-r">R/</i>
      <b className="brand-word-one">ONE</b>
    </span>
  );
}

type BrandLockupProps = {
  size?: number;
  variant?: 'ink' | 'paper' | 'ghost';
  tone?: 'light' | 'dark';
  tagline?: string;
  className?: string;
  priority?: boolean;
};

export function BrandLockup({ size = 40, variant = 'ink', tone = 'light', tagline, className = '', priority = false }: BrandLockupProps) {
  return (
    <span className={`brand-lockup brand-lockup-${tone} ${className}`.trim()}>
      <BrandLogo size={size} variant={variant} priority={priority} />
      <span className="brand-lockup-text">
        <BrandWord />
        {tagline ? <small>{tagline}</small> : null}
      </span>
    </span>
  );
}