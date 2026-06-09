'use client';
import Topbar from './Topbar';
import TelegramButton from './TelegramButton';
import LayoutWithBubbles from './LayoutWithBubbles';
import type { RiskScoreResponse, Palette } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

const TELEGRAM_URL = 'https://t.me/YD_IL';

/** Render section body: if it contains the Telegram URL, strip it and show the button below */
function renderBody(body: string) {
  if (!body.includes(TELEGRAM_URL)) {
    return <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.65, maxWidth: 720 }}>{body}</div>;
  }
  const cleaned = body.replace(TELEGRAM_URL, '').replace(/\s{2,}/g, ' ').trim();
  return (
    <>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.65, maxWidth: 720 }}>{cleaned}</div>
      <div style={{ marginTop: 14 }}>
        <TelegramButton />
      </div>
    </>
  );
}

export default function ScreenAccessibility({ palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const sectionsData = (t('accessibility.sections') || []) as { title: string; body: string }[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <LayoutWithBubbles>
          <div style={{ maxWidth: 760 }}>
            <div className="bi-eyebrow">{t('accessibility.eyebrow')}</div>
            <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              {t('accessibility.title')}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6, textWrap: 'pretty' } as React.CSSProperties}>
              {t('accessibility.desc')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sectionsData.map((s) => (
              <div key={s.title} className="bi-card">
                <div className="bi-card-title">{s.title.toUpperCase()}</div>
                {renderBody(s.body)}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-4)', letterSpacing: '0.01em' }}>
            {t('accessibility.lastUpdated')}
          </div>
        </LayoutWithBubbles>
      </div>
    </div>
  );
}
