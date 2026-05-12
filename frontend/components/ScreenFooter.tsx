'use client';
import Topbar from './Topbar';
import type { Palette } from '@/lib/types';

interface Props {
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
}

const COLS = [
  { title: 'BUBBLEINDEX',    links: ['About', 'Methodology', 'Changelog', 'API access', 'Press kit'] },
  { title: 'DATA & METHODS', links: ['Indicators', 'Data sources', 'Model calibration', 'Backtest archive', 'FAQ'] },
  { title: 'APPS',           links: ['Web', 'iOS', 'Android', 'macOS', 'Windows'] },
];
const LEGAL = ['Accessibility', 'Status', 'Privacy Policy', 'Terms of Use', 'Cookie Settings', 'Do Not Sell My Info'];

export default function ScreenFooter({ palette, onCyclePalette, onNavigate }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="home" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.08em', fontWeight: 500, color: 'var(--ink-1)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: 'linear-gradient(135deg, var(--t-2), var(--t-8))', display: 'inline-block' }} />
                BUBBLEINDEX
              </div>
              <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-3)', maxWidth: 280 }}>
                A single risk score for the entire market — scored against 125 years of bubble history.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                {(['X', 'in', 'GH', 'RSS'] as string[]).map((s) => (
                  <div key={s} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1px solid var(--hairline)', background: 'var(--panel-2)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.04em', color: 'var(--ink-2)', cursor: 'pointer' }}>{s}</div>
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

          <div style={{ padding: '14px 18px', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--panel-3)', border: '1px solid var(--hairline)', color: 'var(--t-7)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>!</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink-1)' }}>Not investment advice.</strong> BubbleIndex is a research tool. Risk scores are derived from public data and a quantitative model — they describe historical conditions, not future returns. Past performance does not predict future outcomes.
            </div>
          </div>

          <div style={{ paddingTop: 24, borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
              © 2025 BubbleIndex Research, Ltd. · All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {LEGAL.map((l) => (
                <a key={l} href="#" style={{ fontSize: 11.5, color: 'var(--ink-3)', textDecoration: 'none', letterSpacing: '0.01em' }}>{l}</a>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', letterSpacing: '0.12em' }}>
              BUILD 2025.05.12 · v0.1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

