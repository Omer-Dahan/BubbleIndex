'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/lib/useBreakpoint';
import SiteFooter from './SiteFooter';
import { api } from '@/lib/api';
import type { RiskScoreResponse, SnapshotSummary, GaugeKind, Palette, Density, Theme } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

const PALETTES: Palette[] = ['temperature', 'traffic', 'violet', 'mono'];

interface AppShellContextValue {
  data: RiskScoreResponse | null;
  snapshots: SnapshotSummary[];
  gaugeKind: GaugeKind;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error('useAppShell must be used within <AppShell>');
  return ctx;
}

interface AppShellProps {
  initialData: RiskScoreResponse | null;
  initialSnapshots: SnapshotSummary[];
  children: React.ReactNode;
}

export default function AppShell({ initialData, initialSnapshots, children }: AppShellProps) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const [data, setData] = useState<RiskScoreResponse | null>(initialData);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>(initialSnapshots);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Tweaks state
  const [gaugeKind, setGaugeKind] = useState<GaugeKind>('radial');
  const [palette, setPalette]   = useState<Palette>('temperature');
  const [density, setDensity]   = useState<Density>('comfortable');
  const [theme, setTheme]       = useState<Theme>('dark');
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState<number | null>(null);

  const cyclePalette = useCallback(() => {
    setPalette(p => PALETTES[(PALETTES.indexOf(p) + 1) % PALETTES.length]);
  }, []);

  const openTweaks = useCallback(() => setTweaksOpen(o => !o), []);

  // Apply theme/density/palette to root
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme   = theme;
    root.dataset.density = density;
    root.dataset.palette = palette;
  }, [theme, density, palette]);

  // Load GA opt-out preference and apply it to window on mount
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (gaId && typeof window !== 'undefined') {
      const optOut = localStorage.getItem('bubble_index_ga_opt_out') === 'true';
      (window as any)[`ga-disable-${gaId}`] = optOut;
    }
  }, []);

  // Synchronize state with server props when they change (e.g. on ISR revalidation updates)
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bubble_index_latest_data', JSON.stringify(initialData));
      }
    }
    if (initialSnapshots && initialSnapshots.length > 0) {
      setSnapshots(initialSnapshots);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bubble_index_latest_snapshots', JSON.stringify(initialSnapshots));
      }
    }
  }, [initialData, initialSnapshots]);

  // Fallback client-side fetch ONLY if we don't have initial server data
  useEffect(() => {
    if (initialData && initialSnapshots && initialSnapshots.length > 0) {
      setLoading(false);
      return;
    }

    // Check if we have localStorage data to prevent blank screen
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem('bubble_index_latest_data');
      const cachedSnaps = localStorage.getItem('bubble_index_latest_snapshots');
      if (cachedData && !data) {
        try { setData(JSON.parse(cachedData)); } catch (e) {}
      }
      if (cachedSnaps && (!snapshots || snapshots.length === 0)) {
        try { setSnapshots(JSON.parse(cachedSnaps)); } catch (e) {}
      }
    }

    setLoading(true);
    const scorePromise = api.getLatestScore()
      .catch(() => api.getRiskScore());
    const snapshotsPromise = api.getAllSnapshots().catch(() => api.getSnapshots(730)).catch(() => []);

    Promise.all([scorePromise, snapshotsPromise])
      .then(([d, snaps]) => {
        setData(d);
        setSnapshots(snaps);
        if (typeof window !== 'undefined') {
          localStorage.setItem('bubble_index_latest_data', JSON.stringify(d));
          localStorage.setItem('bubble_index_latest_snapshots', JSON.stringify(snaps));
        }
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialData, initialSnapshots]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Re-read the latest snapshot; server-side refresh is admin-only
      const d = await api.getLatestScore().catch(() => api.getRiskScore());
      setData(d);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bubble_index_latest_data', JSON.stringify(d));
      }
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const effectiveData = overrideScore !== null && data
    ? { ...data, composite_score: overrideScore }
    : data;

  const contextValue: AppShellContextValue = {
    data: effectiveData,
    snapshots,
    gaugeKind,
    palette,
    onCyclePalette: cyclePalette,
    onOpenTweaks: openTweaks,
  };

  return (
    <AppShellContext.Provider value={contextValue}>
      {/* Loading bar */}
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 9999, background: 'linear-gradient(to right, var(--t-2), var(--t-7))', animation: 'pulse 1.5s ease-in-out infinite' }} />
      )}

      {/* Error banner */}
      {error && !loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, padding: '10px 24px', background: 'color-mix(in srgb, var(--t-9) 15%, var(--panel))', borderBottom: '1px solid color-mix(in srgb, var(--t-9) 40%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--t-8)', letterSpacing: '0.08em' }}>
            {t('common.errorBanner', { error })}
          </span>
          <button onClick={handleRefresh} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
            {t('common.retry')}
          </button>
        </div>
      )}

      {children}

      <SiteFooter />

      {/* Mobile bottom-sheet backdrop */}
      {isMobile && tweaksOpen && (
        <div
          onClick={() => setTweaksOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9985, background: 'rgba(0,0,0,0.5)' }}
        />
      )}

      {/* Tweaks panel */}
      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9990,
      } : {
        position: 'fixed', bottom: 24, right: isRtl ? 'auto' : 24, left: isRtl ? 24 : 'auto', zIndex: 9990,
      }}>
        {tweaksOpen && (
          <div style={isMobile ? {
            background: 'var(--panel)', borderTop: '1px solid var(--hairline)',
            borderRadius: '16px 16px 0 0', padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
            display: 'flex', flexDirection: 'column', gap: 18, direction: isRtl ? 'rtl' : 'ltr',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', maxHeight: '80vh', overflowY: 'auto',
          } : {
            marginBottom: 10, background: 'var(--panel)', border: '1px solid var(--hairline)',
            borderRadius: 12, padding: 20, width: 270,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
            gap: 18, direction: isRtl ? 'rtl' : 'ltr',
          }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>{t('tweaks.title')}</div>

            {/* Risk score override */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>
                {t('tweaks.riskScorePreview', { score: overrideScore ?? data?.composite_score ?? 72 })}
              </div>
              <input type="range" min={0} max={100} step={1}
                value={overrideScore ?? data?.composite_score ?? 72}
                onChange={e => setOverrideScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--t-7)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>0</span>
                <button onClick={() => setOverrideScore(null)} className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>{t('tweaks.reset')}</button>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>100</span>
              </div>
            </div>

            {/* Gauge style */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>{t('tweaks.gaugeStyle')}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['radial','arc','bar','abstract'] as GaugeKind[]).map(g => (
                  <button key={g} onClick={() => setGaugeKind(g)} className="mono" style={{ fontSize: 11, padding: '5px 9px', borderRadius: 6, border: '1px solid var(--hairline)', background: gaugeKind === g ? 'var(--panel-3)' : 'transparent', color: gaugeKind === g ? 'var(--ink-1)' : 'var(--ink-4)', cursor: 'pointer', letterSpacing: '0.04em' }}>{g}</button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>{t('tweaks.density')}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['compact','comfortable','spacious'] as Density[]).map(d => (
                  <button key={d} onClick={() => setDensity(d)} className="mono" style={{ fontSize: 11, padding: '5px 9px', borderRadius: 6, border: '1px solid var(--hairline)', background: density === d ? 'var(--panel-3)' : 'transparent', color: density === d ? 'var(--ink-1)' : 'var(--ink-4)', cursor: 'pointer', letterSpacing: '0.04em' }}>{d.slice(0,5)}</button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>{t('tweaks.theme')}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['dark','light'] as Theme[]).map(th => (
                  <button key={th} onClick={() => setTheme(th)} className="mono" style={{ fontSize: 11, padding: '5px 9px', borderRadius: 6, border: '1px solid var(--hairline)', background: theme === th ? 'var(--panel-3)' : 'transparent', color: theme === th ? 'var(--ink-1)' : 'var(--ink-4)', cursor: 'pointer', letterSpacing: '0.04em' }}>{th}</button>
                ))}
              </div>
            </div>

            {/* Palette */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>{t('tweaks.palette')}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PALETTES.map(p => (
                  <button key={p} onClick={() => setPalette(p)} className="mono" style={{ fontSize: 11, padding: '5px 9px', borderRadius: 6, border: '1px solid var(--hairline)', background: palette === p ? 'var(--panel-3)' : 'transparent', color: palette === p ? 'var(--ink-1)' : 'var(--ink-4)', cursor: 'pointer', letterSpacing: '0.04em' }}>{p.slice(0,6)}</button>
                ))}
              </div>
            </div>

            {/* Refresh */}
            <button onClick={handleRefresh} disabled={loading} className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', padding: '9px 14px', borderRadius: 8, border: '1px solid var(--hairline-2)', background: 'var(--panel-2)', color: loading ? 'var(--ink-4)' : 'var(--ink-1)', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? t('tweaks.fetching') : t('tweaks.refreshData')}
            </button>
          </div>
        )}

        {/* Floating action button — hidden on mobile when panel is open (panel covers bottom) */}
        {(!isMobile || !tweaksOpen) && (
        <button onClick={openTweaks} style={isMobile ? {
          position: 'fixed', bottom: 'calc(24px + env(safe-area-inset-bottom))',
          right: isRtl ? 'auto' : 24, left: isRtl ? 24 : 'auto',
          width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--hairline-2)',
          background: tweaksOpen ? 'var(--panel-3)' : 'var(--panel)',
          color: tweaksOpen ? 'var(--ink-1)' : 'var(--ink-2)', cursor: 'pointer', display: 'grid', placeItems: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        } : {
          width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--hairline-2)',
          background: tweaksOpen ? 'var(--panel-3)' : 'var(--panel)',
          color: tweaksOpen ? 'var(--ink-1)' : 'var(--ink-2)', cursor: 'pointer', display: 'grid', placeItems: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </AppShellContext.Provider>
  );
}
