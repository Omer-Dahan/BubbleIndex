'use client';
import { useState, useEffect } from 'react';
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

export default function ScreenCookieSettings({ palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const [optOut, setOptOut] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load initial preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem('bubble_index_ga_opt_out');
      setOptOut(savedPref === 'true');
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bubble_index_ga_opt_out', optOut ? 'true' : 'false');
      
      // Instantly apply GA disable flag to the current window
      const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      if (gaId) {
        (window as any)[`ga-disable-${gaId}`] = optOut;
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <LayoutWithBubbles>
          <div style={{ maxWidth: 760 }}>
            <div className="bi-eyebrow">{t('cookieSettings.eyebrow')}</div>
            <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              {t('cookieSettings.title')}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6, textWrap: 'pretty' } as React.CSSProperties}>
              {t('cookieSettings.desc')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="bi-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="bi-card-title">{t('cookieSettings.optOutTitle')}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.65 }}>
                {t('cookieSettings.optOutDesc')}
              </div>

              {/* Toggle Switch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 8, marginTop: 8, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>
                  {optOut ? t('cookieSettings.disableToggle') : t('cookieSettings.enableToggle')}
                </span>
                
                <button 
                  onClick={() => setOptOut(!optOut)}
                  style={{
                    width: 50,
                    height: 26,
                    borderRadius: 13,
                    background: optOut ? 'var(--t-8)' : 'var(--panel-3)',
                    border: '1px solid var(--hairline-2)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    padding: 0
                  }}
                  aria-label="Toggle Google Analytics tracking"
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--bg)',
                    border: '1px solid var(--hairline)',
                    position: 'absolute',
                    top: 2,
                    left: optOut ? 'calc(100% - 22px)' : 2,
                    transition: 'left 0.2s ease, transform 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>

              {/* Save Button & Alert Banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <button 
                  onClick={handleSave}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    fontSize: 13,
                    color: 'var(--bg)',
                    background: 'var(--ink-1)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                >
                  {t('cookieSettings.saveButton')}
                </button>

                {saved && (
                  <div style={{
                    fontSize: 13,
                    color: 'var(--t-8)',
                    background: 'color-mix(in srgb, var(--t-8) 10%, var(--panel-2))',
                    border: '1px solid color-mix(in srgb, var(--t-8) 30%, transparent)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}>
                    {t('cookieSettings.savedNotification')}
                  </div>
                )}
              </div>

            </div>
          </div>
        </LayoutWithBubbles>
      </div>
    </div>
  );
}
