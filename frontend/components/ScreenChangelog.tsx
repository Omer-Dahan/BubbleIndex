'use client';
import Topbar from './Topbar';
import LayoutWithBubbles from './LayoutWithBubbles';
import type { RiskScoreResponse, Palette } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

interface Release {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export default function ScreenChangelog({ palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const releases = (t('changelog.releases') || []) as Release[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <LayoutWithBubbles>
          <div style={{ maxWidth: 760 }}>
            <div className="bi-eyebrow">{t('changelog.eyebrow')}</div>
            <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              {t('changelog.title')}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6, textWrap: 'pretty' } as React.CSSProperties}>
              {t('changelog.desc')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {releases.map((rel, idx) => (
              <div key={rel.version} className="bi-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 11, background: idx === 0 ? 'var(--panel-3)' : 'var(--panel-2)', color: idx === 0 ? 'var(--t-7)' : 'var(--ink-2)', border: '1px solid var(--hairline)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      {rel.version}
                    </span>
                    <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink-1)', margin: 0 }}>
                      {rel.title}
                    </h2>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                    {rel.date}
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: isRtl ? 0 : 20, paddingRight: isRtl ? 20 : 0, listStyleType: 'square', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rel.changes.map((change, cIdx) => (
                    <li key={cIdx} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </LayoutWithBubbles>
      </div>
    </div>
  );
}
