'use client';

import {
  Bookmark,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  MessageCircle,
  Music2,
  Send,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { type BrandProfile, type SocialKey, socialLinks } from '@/lib/store';

const ICONS: Record<SocialKey, LucideIcon> = {
  whatsapp: Send,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  youtube: Youtube,
  telegram: Send,
  x: Twitter,
  snapchat: MessageCircle,
  threads: MessageCircle,
  linkedin: Linkedin,
  pinterest: Bookmark,
  website: Globe,
  map: MapPin,
};

type SocialLinksProps = {
  profile: BrandProfile;
  variant?: 'chip' | 'icon' | 'plain';
  className?: string;
  exclude?: SocialKey[];
};

export default function SocialLinks({ profile, variant = 'chip', className = '', exclude = ['whatsapp'] }: SocialLinksProps) {
  const links = socialLinks(profile).filter((link) => !exclude.includes(link.key));
  if (!links.length) return null;

  return (
    <div className={`social-links social-links-${variant} ${className}`.trim()} aria-label="وسائل التواصل الاجتماعي">
      {links.map((link) => {
        const Icon = ICONS[link.key];
        const external = link.href.startsWith('http');
        return (
          <a
            key={link.key}
            href={link.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            aria-label={link.label}
            title={link.label}
          >
            <Icon size={16} />
            {variant === 'chip' ? <span>{link.label}</span> : null}
          </a>
        );
      })}
    </div>
  );
}