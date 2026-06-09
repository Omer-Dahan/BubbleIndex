'use client';
import Link from 'next/link';
import Topbar from './Topbar';
import LayoutWithBubbles from './LayoutWithBubbles';
import type { RiskScoreResponse, Palette } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { useIsMobile, useIsTablet } from '@/lib/useBreakpoint';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

export default function ScreenAbout({ palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const valuesData = (t('about.values') || []) as { title: string; body: string }[];

  const linkText = t('topbar.nav.methodology');
  const linkEl = (
    <Link href="/methodology" style={{ color: 'var(--ink-1)', textDecoration: 'underline', cursor: 'pointer' }}>
      {linkText}
    </Link>
  );
  const notAdviceTemplate = t('about.notAdviceDesc') || '';
  const parts = notAdviceTemplate.split('{link}');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <LayoutWithBubbles>
          <div style={{ maxWidth: 760 }}>
            <div className="bi-eyebrow">{t('about.eyebrow')}</div>
            <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              {t('about.title')}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6, textWrap: 'pretty' } as React.CSSProperties}>
              {t('about.desc')}
            </div>
          </div>

          <div className="bi-card">
            <div className="bi-card-title">{t('about.whatWeBuildTitle')}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.65, maxWidth: 720 }}>
              {t('about.whatWeBuildDesc')}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 'var(--gap-grid)' }}>
            {valuesData.map((v) => (
              <div key={v.title} className="bi-card-tight">
                <div className="bi-card-title">{v.title.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.6 }}>{v.body}</div>
              </div>
            ))}
          </div>

          <div className="bi-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--panel-3)', border: '1px solid var(--hairline)', color: 'var(--t-7)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>!</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--ink-1)' }}>{t('about.notAdviceTitle')}{' '}</strong>
              {parts[0]}
              {linkEl}
              {parts[1]}
            </div>
          </div>
        </LayoutWithBubbles>
      </div>
    </div>
  );
}

