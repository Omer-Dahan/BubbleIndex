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

export default function ScreenTerms({ palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const sectionsData = (t('terms.sections') || []) as { title: string; body: string }[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <LayoutWithBubbles>
          <div style={{ maxWidth: 760 }}>
            <div className="bi-eyebrow">{t('terms.eyebrow')}</div>
            <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              {t('terms.title')}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6, textWrap: 'pretty' } as React.CSSProperties}>
              {t('terms.desc')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sectionsData.map((s) => (
              <div key={s.title} className="bi-card">
                <div className="bi-card-title">{s.title.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.65, maxWidth: 720 }}>{s.body}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-4)', letterSpacing: '0.01em' }}>
            {t('terms.lastUpdated')}
          </div>
        </LayoutWithBubbles>
      </div>
    </div>
  );
}
