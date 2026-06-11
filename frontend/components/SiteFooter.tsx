'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useIsMobile } from '@/lib/useBreakpoint';

export default function SiteFooter() {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();

  const footerCols = (t('footer.cols') || []) as { title: string; links: string[] }[];
  const colHrefs = ['/about', '/contact', '/methodology', '/changelog', '/api-access'];
  const navLinks = (footerCols[0]?.links ?? []).map((label, i) => ({
    label,
    href: colHrefs[i] ?? null,
  }));

  const legalLabels = (t('footer.legal') || []) as string[];
  const legalHrefs = ['/accessibility', '/status', '/privacy', '/terms', '/cookie-settings', null];
  const legalLinks = legalLabels.map((label, idx) => ({
    label,
    href: legalHrefs[idx] ?? null,
  }));

  const dot = <span style={{ color: 'var(--ink-5)', fontSize: 11, padding: '0 5px' }}>·</span>;

  return (
    <footer style={{
      background: 'var(--panel)',
      borderTop: '1px solid var(--hairline)',
      direction: isRtl ? 'rtl' : 'ltr',
    }}>
      {/* Gradient accent line */}
      <div style={{ height: 1, background: 'linear-gradient(to right, var(--t-2), var(--t-8))', opacity: 0.4 }} />

      {/* Disclaimer strip */}
      <div style={{
        padding: '9px var(--pad-screen)',
        borderBottom: '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--t-7)',
          lineHeight: '18px',
          flexShrink: 0,
        }}>!</span>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.55 }}>
          <strong style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{t('footer.disclaimerTitle')}{' '}</strong>
          {t('footer.disclaimerDesc')}
        </p>
      </div>

      {/* All links row */}
      <div style={{
        padding: '14px var(--pad-screen)',
        borderBottom: '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {/* Nav + legal links together */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {[...navLinks, ...legalLinks].map((l, i) => (
            <React.Fragment key={l.label}>
              {i > 0 && <span style={{ color: 'var(--hairline-2)', fontSize: 13, padding: '0 2px' }}>|</span>}
              {l.href ? (
                <Link href={l.href} style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--ink-2)',
                  textDecoration: 'none',
                  padding: '4px 12px',
                  borderRadius: 6,
                  transition: 'background 0.15s, color 0.15s',
                }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'var(--panel-2)';
                    e.currentTarget.style.color = 'var(--ink-1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--ink-2)';
                  }}
                >{l.label}</Link>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', padding: '4px 12px' }}>{l.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Build number */}
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-5)', letterSpacing: '0.08em', flexShrink: 0 }}>
          {t('footer.build')}
        </span>
      </div>

      {/* Brand + copyright row */}
      <div style={{
        padding: '10px var(--pad-screen)',
        paddingBottom: `calc(${isMobile ? 76 : 10}px + env(safe-area-inset-bottom))`,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
          color: 'var(--ink-3)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: 1, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--t-2), var(--t-8))',
            display: 'inline-block',
          }} />
          BUBBLEINDEX
        </span>
        {dot}
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>
          {t('footer.copyright')}
        </span>
      </div>
    </footer>
  );
}
