'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { useIsMobile } from '@/lib/useBreakpoint';
import type { Palette } from '@/lib/types';

interface Props {
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

const NAV = [
  ['/', 'topbar.nav.home'],
  ['/historical', 'topbar.nav.historical'],
  ['/indicators', 'topbar.nav.indicators'],
  ['/replay', 'topbar.nav.replay'],
  ['/ai', 'topbar.nav.ai'],
  ['/methodology', 'topbar.nav.methodology'],
] as const;

export default function Topbar({ palette, onCyclePalette, onOpenTweaks }: Props) {
  const pathname = usePathname();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = isMobile && menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, menuOpen]);

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24,
        padding: '16px var(--pad-screen)',
        borderBottom: '1px solid var(--hairline)',
        background: 'var(--panel)', flexShrink: 0,
        direction: isRtl ? 'rtl' : 'ltr',
        position: 'relative', zIndex: 200,
      }}>
        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 15,
          letterSpacing: '0.08em', fontWeight: 500, color: 'var(--ink-1)',
          flexShrink: 0,
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: 2,
            background: 'linear-gradient(135deg, var(--t-2), var(--t-8))',
            display: 'inline-block',
          }} />
          {t('common.title')}
        </div>

        {/* Desktop Nav */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4, marginInlineStart: 16 }}>
            {NAV.map(([href, labelKey]) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link key={href} href={href} style={{
                  fontSize: 14, color: isActive ? 'var(--ink-1)' : 'var(--ink-3)',
                  padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
                  background: isActive ? 'var(--panel-3)' : 'transparent',
                  fontFamily: 'var(--font-sans)', textDecoration: 'none', display: 'inline-block',
                }}>{t(labelKey)}</Link>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Desktop controls */}
        {!isMobile && (
          <>
            {/* Language Switcher */}
            <button onClick={() => setLanguage(language === 'en' ? 'he' : 'en')} style={{
              height: 34, padding: '0 12px', display: 'flex', alignItems: 'center',
              border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)',
              color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.08em', cursor: 'pointer', flexShrink: 0,
            }}>
              {language === 'en' ? 'עברית' : 'EN'}
            </button>

            {/* Palette switcher */}
            <button onClick={onCyclePalette} title={t('topbar.paletteTooltip', { palette })} style={{
              height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)',
              color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.10em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0,
            }}>
              <span style={{ display: 'inline-flex', gap: 2 }}>
                {(['var(--t-1)', 'var(--t-5)', 'var(--t-9)'] as string[]).map((c, i) => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                ))}
              </span>
              {palette}
            </button>

            {/* Settings icon */}
            <button
              onClick={onOpenTweaks}
              title={t('topbar.tweaksTooltip')}
              style={{
                width: 34, height: 34, display: 'grid', placeItems: 'center',
                border: '1px solid var(--hairline)', background: 'var(--panel-2)',
                borderRadius: 8, color: 'var(--ink-2)', cursor: onOpenTweaks ? 'pointer' : 'default',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
              </svg>
            </button>
          </>
        )}

        {/* Mobile: lang + hamburger */}
        {isMobile && (
          <>
            <button onClick={() => setLanguage(language === 'en' ? 'he' : 'en')} style={{
              height: 34, padding: '0 10px', display: 'flex', alignItems: 'center',
              border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)',
              color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.08em', cursor: 'pointer', flexShrink: 0,
            }}>
              {language === 'en' ? 'ע' : 'EN'}
            </button>

            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
              style={{
                width: 44, height: 44, display: 'grid', placeItems: 'center',
                border: '1px solid var(--hairline)', background: menuOpen ? 'var(--panel-3)' : 'var(--panel-2)',
                borderRadius: 8, color: 'var(--ink-2)', cursor: 'pointer', flexShrink: 0,
              }}
            >
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              )}
            </button>
          </>
        )}
      </div>

      {/* Mobile menu drawer */}
      {isMobile && menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMenu}
            style={{
              position: 'fixed', inset: 0, zIndex: 190,
              background: 'rgba(0,0,0,0.5)',
            }}
          />
          {/* Nav panel — top: 77 = 16px padding-top + 44px button + 16px padding-bottom + 1px border */}
          <div style={{
            position: 'fixed', top: 77, left: 0, right: 0, zIndex: 195,
            background: 'var(--panel)', borderBottom: '1px solid var(--hairline)',
            display: 'flex', flexDirection: 'column',
            direction: isRtl ? 'rtl' : 'ltr',
          }}>
            {NAV.map(([href, labelKey]) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  style={{
                    fontSize: 16, color: isActive ? 'var(--ink-1)' : 'var(--ink-3)',
                    padding: '14px var(--pad-screen)',
                    background: isActive ? 'var(--panel-3)' : 'transparent',
                    borderBottom: '1px solid var(--hairline)',
                    fontFamily: 'var(--font-sans)', textDecoration: 'none', display: 'block',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >{t(labelKey)}</Link>
              );
            })}
            {/* Mobile palette + tweaks row */}
            <div style={{ display: 'flex', gap: 10, padding: '14px var(--pad-screen)' }}>
              <button onClick={() => { onCyclePalette(); closeMenu(); }} style={{
                flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)',
                color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.10em', textTransform: 'uppercase', cursor: 'pointer',
              }}>
                <span style={{ display: 'inline-flex', gap: 2 }}>
                  {(['var(--t-1)', 'var(--t-5)', 'var(--t-9)'] as string[]).map((c, i) => (
                    <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  ))}
                </span>
                {palette}
              </button>
              <button
                onClick={() => { onOpenTweaks?.(); closeMenu(); }}
                style={{
                  width: 44, height: 44, display: 'grid', placeItems: 'center',
                  border: '1px solid var(--hairline)', background: 'var(--panel-2)',
                  borderRadius: 8, color: 'var(--ink-2)', cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
