'use client';
import { useState, useEffect, useCallback } from 'react';
import ScreenHome from '@/components/ScreenHome';
import ScreenHistorical from '@/components/ScreenHistorical';
import ScreenIndicators from '@/components/ScreenIndicators';
import ScreenReplay from '@/components/ScreenReplay';
import ScreenAI from '@/components/ScreenAI';
import ScreenMethodology from '@/components/ScreenMethodology';
import ScreenFooter from '@/components/ScreenFooter';
import { api } from '@/lib/api';
import type { RiskScoreResponse, SnapshotSummary, GaugeKind, Palette, Density, Theme } from '@/lib/types';

type Screen = 'home' | 'historical' | 'indicators' | 'replay' | 'ai' | 'methodology' | 'footer';
const PALETTES: Palette[] = ['temperature', 'traffic', 'violet', 'mono'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [focusCategory, setFocusCategory] = useState<string | undefined>();
  const [data, setData] = useState<RiskScoreResponse | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch live data
  useEffect(() => {
    setLoading(true);
    const scorePromise = api.getLatestScore()
      .catch(() => api.getRiskScore());
    const snapshotsPromise = api.getSnapshots(730).catch(() => []);

    Promise.all([scorePromise, snapshotsPromise])
      .then(([d, snaps]) => {
        setData(d);
        setSnapshots(snaps);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const d = await api.refreshScore();
      setData(d);
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

  const handleNavigate = useCallback((s: string) => {
    if (s.startsWith('methodology:')) {
      const cat = s.split(':')[1];
      setFocusCategory(cat);
      setScreen('methodology');
    } else {
      setFocusCategory(undefined);
      setScreen(s as Screen);
    }
  }, []);

  const screenProps = {
    data: effectiveData,
    palette,
    onCyclePalette: cyclePalette,
    onNavigate: handleNavigate,
    onOpenTweaks: openTweaks,
  };

  return (
    <>
      {/* Loading bar */}
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 9999, background: 'linear-gradient(to right, var(--t-2), var(--t-7))', animation: 'pulse 1.5s ease-in-out infinite' }} />
      )}

      {/* Error banner */}
      {error && !loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, padding: '10px 24px', background: 'color-mix(in srgb, var(--t-9) 15%, var(--panel))', borderBottom: '1px solid color-mix(in srgb, var(--t-9) 40%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--t-8)', letterSpacing: '0.08em' }}>
            ⚠ Backend unavailable — showing demo data. {error}
          </span>
          <button onClick={handleRefresh} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>RETRY</button>
        </div>
      )}

      {/* Screens */}
      {screen === 'home'        && <ScreenHome       {...screenProps} gaugeKind={gaugeKind} snapshots={snapshots} />}
      {screen === 'historical'  && <ScreenHistorical {...screenProps} />}
      {screen === 'indicators'  && <ScreenIndicators {...screenProps} />}
      {screen === 'replay'      && <ScreenReplay     {...screenProps} />}
      {screen === 'ai'          && <ScreenAI         {...screenProps} />}
      {screen === 'methodology' && <ScreenMethodology {...screenProps} focusCategory={focusCategory} />}
      {screen === 'footer'      && <ScreenFooter palette={palette} onCyclePalette={cyclePalette} onNavigate={handleNavigate} onOpenTweaks={openTweaks} />}

      {/* Tweaks panel */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9990 }}>
        {tweaksOpen && (
          <div style={{ marginBottom: 10, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 12, padding: 20, width: 270, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>TWEAKS</div>

            {/* Risk score override */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>
                RISK SCORE PREVIEW · {overrideScore ?? data?.composite_score ?? 72}
              </div>
              <input type="range" min={0} max={100} step={1}
                value={overrideScore ?? data?.composite_score ?? 72}
                onChange={e => setOverrideScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--t-7)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>0</span>
                <button onClick={() => setOverrideScore(null)} className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>RESET</button>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)' }}>100</span>
              </div>
            </div>

            {/* Gauge style */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>GAUGE STYLE</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['radial','arc','bar','abstract'] as GaugeKind[]).map(g => (
                  <button key={g} onClick={() => setGaugeKind(g)} className="mono" style={{ fontSize: 11, padding: '5px 9px', borderRadius: 6, border: '1px solid var(--hairline)', background: gaugeKind === g ? 'var(--panel-3)' : 'transparent', color: gaugeKind === g ? 'var(--ink-1)' : 'var(--ink-4)', cursor: 'pointer', letterSpacing: '0.04em' }}>{g}</button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>DENSITY</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['compact','comfortable','spacious'] as Density[]).map(d => (
                  <button key={d} onClick={() => setDensity(d)} className="mono" style={{ fontSize: 11, padding: '5px 9px', borderRadius: 6, border: '1px solid var(--hairline)', background: density === d ? 'var(--panel-3)' : 'transparent', color: density === d ? 'var(--ink-1)' : 'var(--ink-4)', cursor: 'pointer', letterSpacing: '0.04em' }}>{d.slice(0,5)}</button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>THEME</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['dark','light'] as Theme[]).map(t => (
                  <button key={t} onClick={() => setTheme(t)} className="mono" style={{ fontSize: 11, padding: '5px 9px', borderRadius: 6, border: '1px solid var(--hairline)', background: theme === t ? 'var(--panel-3)' : 'transparent', color: theme === t ? 'var(--ink-1)' : 'var(--ink-4)', cursor: 'pointer', letterSpacing: '0.04em' }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Palette */}
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: '0.06em' }}>PALETTE</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PALETTES.map(p => (
                  <button key={p} onClick={() => setPalette(p)} className="mono" style={{ fontSize: 11, padding: '5px 9px', borderRadius: 6, border: '1px solid var(--hairline)', background: palette === p ? 'var(--panel-3)' : 'transparent', color: palette === p ? 'var(--ink-1)' : 'var(--ink-4)', cursor: 'pointer', letterSpacing: '0.04em' }}>{p.slice(0,6)}</button>
                ))}
              </div>
            </div>

            {/* Refresh */}
            <button onClick={handleRefresh} disabled={loading} className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', padding: '9px 14px', borderRadius: 8, border: '1px solid var(--hairline-2)', background: 'var(--panel-2)', color: loading ? 'var(--ink-4)' : 'var(--ink-1)', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'FETCHING...' : '↻ REFRESH DATA'}
            </button>
          </div>
        )}

        {/* Floating action button */}
        <button onClick={openTweaks} style={{
          width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--hairline-2)',
          background: tweaksOpen ? 'var(--panel-3)' : 'var(--panel)',
          color: tweaksOpen ? 'var(--ink-1)' : 'var(--ink-2)', cursor: 'pointer', display: 'grid', placeItems: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </button>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
