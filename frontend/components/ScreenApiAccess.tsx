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

interface Endpoint {
  path: string;
  desc: string;
}

export default function ScreenApiAccess({ palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const endpoints = (t('apiAccess.endpoints') || []) as Endpoint[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <LayoutWithBubbles>
          <div style={{ maxWidth: 760 }}>
            <div className="bi-eyebrow">{t('apiAccess.eyebrow')}</div>
            <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              {t('apiAccess.title')}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6, textWrap: 'pretty' } as React.CSSProperties}>
              {t('apiAccess.desc')}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--gap-grid)' }}>
            <div className="bi-card">
              <div className="bi-card-title">{t('apiAccess.infoTitle')}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.65 }}>
                {t('apiAccess.infoDesc')}
              </div>
            </div>

            <div className="bi-card" style={{ borderLeft: '3px solid var(--t-7)' }}>
              <div className="bi-card-title" style={{ color: 'var(--t-7)' }}>{t('apiAccess.actionTitle')}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.65 }}>
                {t('apiAccess.actionDesc')}
              </div>
              <div style={{ marginTop: 14 }}>
                <TelegramButton />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="bi-eyebrow">{t('apiAccess.endpointsTitle')}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: -6 }}>
              {t('apiAccess.endpointsDesc')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              {endpoints.map((ep) => (
                <div key={ep.path} className="bi-card-tight" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', direction: 'ltr', justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
                    <span className="mono" style={{ fontSize: 10, background: 'var(--panel-3)', color: 'var(--t-8)', border: '1px solid var(--hairline)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                      GET
                    </span>
                    <code className="mono" style={{ fontSize: 12, color: 'var(--ink-1)', fontWeight: 600 }}>
                      {ep.path}
                    </code>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    {ep.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </LayoutWithBubbles>
      </div>
    </div>
  );
}
