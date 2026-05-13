'use client';
import Topbar from './Topbar';
import type { Palette } from '@/lib/types';

interface Props {
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
  onOpenTweaks?: () => void;
}

const COLS = [
  { title: 'BUBBLEINDEX',    links: ['About', 'Methodology', 'Changelog', 'API access', 'Press kit'] },
  { title: 'DATA & METHODS', links: ['Indicators', 'Data sources', 'Model calibration', 'Backtest archive', 'FAQ'] },
  { title: 'APPS',           links: ['Web', 'iOS', 'Android', 'macOS', 'Windows'] },
];
const LEGAL = ['Accessibility', 'Status', 'Privacy Policy', 'Terms of Use', 'Cookie Settings', 'Do Not Sell My Info'];

const SOCIAL = [
  {
    label: 'X',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.527-8.615L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    label: 'GitHub',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
  },
  {
    label: 'RSS',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
      </svg>
    ),
  },
];

export default function ScreenFooter({ palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="home" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 'var(--pad-screen)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
          <div style={{ maxWidth: 880, textAlign: 'center' }}>
            <div className="bi-eyebrow">SITE INFORMATION</div>
            <div style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.015em', marginTop: 10, color: 'var(--ink-2)' }}>
              Product nav, methodology, legal, and disclaimer.
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 'calc(var(--pad-screen) * 1.5) var(--pad-screen) var(--pad-screen)', background: 'var(--panel)', borderTop: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 'var(--gap-grid)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 15, letterSpacing: '0.08em', fontWeight: 500, color: 'var(--ink-1)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: 'linear-gradient(135deg, var(--t-2), var(--t-8))', display: 'inline-block' }} />
                BUBBLEINDEX
              </div>
              <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 280 }}>
                A single risk score for the entire market — scored against 125 years of bubble history.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                {SOCIAL.map((s) => (
                  <button key={s.label} title={s.label} style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', border: '1px solid var(--hairline)', background: 'var(--panel-2)', borderRadius: 8, color: 'var(--ink-2)', cursor: 'pointer' }}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
            {COLS.map((col) => (
              <div key={col.title}>
                <div className="bi-eyebrow">{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  {col.links.map((l) => (
                    <a key={l} href="#" style={{ fontSize: 13, color: 'var(--ink-2)', textDecoration: 'none' }}
                      onMouseOver={e => (e.currentTarget.style.color = 'var(--ink-1)')}
                      onMouseOut={e => (e.currentTarget.style.color = 'var(--ink-2)')}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{ padding: '14px 18px', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--panel-3)', border: '1px solid var(--hairline)', color: 'var(--t-7)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>!</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--ink-1)' }}>Not investment advice.</strong> BubbleIndex is a research tool. Risk scores are derived from public data and a quantitative model — they describe historical conditions, not future returns. Past performance does not predict future outcomes.
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ paddingTop: 24, borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
              © 2025 BubbleIndex Research, Ltd. · All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {LEGAL.map((l) => (
                <a key={l} href="#" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none', letterSpacing: '0.01em' }}>{l}</a>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-5)', letterSpacing: '0.08em' }}>
              BUILD 2025.05.12 · v0.1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
