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

export default function ScreenContact({ palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <LayoutWithBubbles>
          <div style={{ maxWidth: 760 }}>
            <div className="bi-eyebrow">{t('contact.eyebrow')}</div>
            <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              {t('contact.title')}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6, textWrap: 'pretty' } as React.CSSProperties}>
              {t('contact.desc')}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--gap-grid)' }}>
            <div className="bi-card">
              <div className="bi-card-title">{t('contact.supportTitle')}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.65 }}>
                {t('contact.supportDesc')}
              </div>
              <div style={{ marginTop: 14 }}>
                <TelegramButton />
              </div>
            </div>

            <div className="bi-card">
              <div className="bi-card-title">{t('contact.privacyTitle')}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.65 }}>
                {t('contact.privacyDesc')}
              </div>
            </div>
          </div>
        </LayoutWithBubbles>
      </div>
    </div>
  );
}

