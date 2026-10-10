'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import BrandLogo, { BrandLockup } from '@/components/brand-logo';
import SocialLinks from '@/components/social-links';
import { useOverlayLock, useScrolled } from '@/lib/hooks';
import { type BrandProfile, type NavLink, brandName, socialLink } from '@/lib/store';

export type { NavLink };



type MenuCategory = { id: string; name: string; count: number; image?: string };

type SiteHeaderProps = {
  profile: BrandProfile;
  cartCount: number;
  onOpenCart: () => void;
  links: NavLink[];
  categories?: MenuCategory[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchResults?: number | null;
  searchHint?: string;
};

export default function SiteHeader({
  profile,
  cartCount,
  onOpenCart,
  links,
  categories = [],
  searchValue,
  onSearchChange,
  searchResults = null,
  searchHint,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const scrolled = useScrolled(10);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  useOverlayLock(menuOpen, () => setMenuOpen(false));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchable = typeof onSearchChange === 'function';
  const whatsapp = socialLink(profile, 'whatsapp');
  const hasMega = categories.length > 0 && links.some((link) => link.href === '/categories');
  const navLinks = useMemo(() => links.filter((link) => link.href !== '/categories' || categories.length === 0), [links, categories.length]);

  function openMega() {
    window.clearTimeout(closeTimer.current);
    setMegaOpen(true);
  }

  function closeMega() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 140);
  }

  return (
    <>
      <header className={`site-header ${scrolled ? 'site-header-scrolled' : ''}`}>
        <div className="header-start">
          <button
            className="mobile-nav-button icon-button"
            type="button"
            title="القائمة"
            aria-label="فتح القائمة"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={19} />
          </button>

          <nav className="header-links" aria-label="التنقل الرئيسي">
            {links.map((link) => (
              <span
                className={`header-link-wrap ${link.href === '/categories' ? 'has-mega' : ''}`}
                key={link.href}
                onMouseEnter={link.href === '/categories' ? openMega : closeMega}
                onMouseLeave={link.href === '/categories' ? closeMega : undefined}
              >
                <Link href={link.href} aria-expanded={link.href === '/categories' ? megaOpen : undefined}>
                  {link.label}
                  {link.href === '/categories' && categories.length ? <ChevronDown size={13} /> : null}
                </Link>
              </span>
            ))}
          </nav>
        </div>

        <Link className="wordmark" href="/" aria-label={`${brandName(profile.name)} — الصفحة الرئيسية`}>
          <BrandLockup size={40} priority className="header-lockup" />
        </Link>

        <div className="header-actions">
          {searchable ? (
            <div className={`header-search ${searchValue ? 'header-search-filled' : ''}`}>
              <Search size={16} className="header-search-icon" />
              <input
                ref={searchRef}
                aria-label="ابحث في المنتجات"
                placeholder="بتدور على إيه؟"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
              />
              {searchValue ? (
                <button className="header-search-clear" type="button" title="مسح البحث" aria-label="مسح البحث" onClick={() => onSearchChange('')}>
                  <X size={13} />
                </button>
              ) : (
                <kbd>/</kbd>
              )}
              {searchResults !== null && searchValue ? (
                <span className="header-search-count" aria-live="polite">{searchResults.toString().padStart(2, '0')} نتيجة</span>
              ) : null}
            </div>
          ) : null}

          <button className="bag-button" type="button" onClick={onOpenCart} aria-label={`فتح السلة، ${cartCount} قطعة`}>
            <ShoppingBag size={18} />
            <span>السلة</span>
            <b className={cartCount ? 'bag-count-active' : ''}>{cartCount}</b>
          </button>
        </div>

        {hasMega && megaOpen ? (
          <div className="mega-menu" onMouseEnter={openMega} onMouseLeave={closeMega}>
            <div className="mega-menu-inner">
              <div className="mega-menu-head">
                <span className="eyebrow">تصفح حسب القسم</span>
                <Link href="/categories">كل الأقسام</Link>
              </div>
              <div className="mega-menu-grid">
                {categories.slice(0, 12).map((category) => (
                  <Link className="mega-menu-item" href={`/categories/${category.id}`} key={category.id}>
                    <span>{category.name}</span>
                    <small>{category.count} قطعة</small>
                  </Link>
                ))}
              </div>
              <div className="mega-menu-foot">
                <Link className="button-dark" href="/offers">العروض الحالية</Link>
                <Link className="link-underline" href="/products">كل المنتجات</Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {menuOpen ? (
        <div
          className="mobile-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false);
          }}
        >
          <aside className="mobile-drawer" role="dialog" aria-modal="true" aria-label="القائمة الرئيسية">
            <div className="mobile-drawer-head">
              <BrandLogo size={34} variant="ghost" />
              <button className="icon-button" type="button" title="إغلاق" onClick={() => setMenuOpen(false)}>
                <X size={19} />
              </button>
            </div>

            {searchable ? (
              <div className="mobile-drawer-search">
                <Search size={16} />
                <input
                  aria-label="ابحث في المنتجات"
                  placeholder="بتدور على إيه؟"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </div>
            ) : null}

            <nav className="mobile-drawer-nav" aria-label="القائمة المحمولة">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {whatsapp ? (
                <a
                  href={`${whatsapp.href}?text=${encodeURIComponent(`مرحباً، عندي استفسار عن منتجات ${brandName(profile.name)}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                >
                  استفسار واتساب
                </a>
              ) : null}
            </nav>

            {categories.length ? (
              <div className="mobile-drawer-categories">
                <span className="mobile-drawer-categories-label">الأقسام</span>
                <div>
                  {categories.slice(0, 10).map((category) => (
                    <Link key={category.id} href={`/categories/${category.id}`} onClick={() => setMenuOpen(false)}>
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <SocialLinks profile={profile} variant="icon" exclude={['whatsapp']} className="mobile-drawer-social" />
            <p className="mobile-drawer-note">{searchHint ?? 'توصيل لكل المحافظات ومتابعة مباشرة للطلب.'}</p>
          </aside>
        </div>
      ) : null}
    </>
  );
}