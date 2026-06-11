'use client';
import { useMemo } from 'react';
import { useIsMobile } from '@/lib/useBreakpoint';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Topbar from './Topbar';
import { HeatCell, Delta } from './Primitives';
import { tempVar } from '@/lib/utils';
import type { RiskScoreResponse, SnapshotSummary, Palette } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

const INDICATORS = [
  { key: 'valuation',       name: 'Valuation',     desc: 'CAPE, P/E vs history',   snapshotKey: 'valuation_score' },
  { key: 'macro_stress',    name: 'Macro',         desc: 'Yield curve, PMI',        snapshotKey: 'macro_stress_score' },
  { key: 'leverage_credit', name: 'Leverage',      desc: 'Margin debt, corp. debt', snapshotKey: 'leverage_credit_score' },
  { key: 'sentiment',       name: 'Sentiment',     desc: 'Retail flows, surveys',   snapshotKey: 'sentiment_score' },
  { key: 'concentration',   name: 'Concentration', desc: 'Top-10 share of cap',     snapshotKey: 'concentration_score' },
] as const;

const MONTHS = 24;

interface Props {
  data: RiskScoreResponse | null;
  snapshots: SnapshotSummary[];
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

// Seeded PRNG fallback for when no real historical data is available
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export default function ScreenIndicators({ data, snapshots, palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();

  const sorted = useMemo(() =>
    [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
  [snapshots]);

  // Downsample to one snapshot per calendar month (last snapshot of each month)
  // so the heatmap columns truly represent months, not raw daily snapshots.
  const monthly = useMemo(() => {
    const byMonth = new Map<string, SnapshotSummary>();
    for (const s of sorted) byMonth.set(s.snapshot_date.slice(0, 7), s);
    return Array.from(byMonth.values());
  }, [sorted]);

  // Build heatmap from real snapshot history; fall back to simulated if insufficient data
  const grid = useMemo(() => INDICATORS.map((ind, i) => {
    const last24 = monthly.slice(-MONTHS);
    if (last24.length >= 4) {
      // Pad left with the oldest value if fewer than MONTHS months
      const row = last24.map(s => (s[ind.snapshotKey as keyof SnapshotSummary] as number) / 100);
      while (row.length < MONTHS) row.unshift(row[0]);
      return row.slice(-MONTHS);
    }
    // Simulated fallback
    const r = rng(i * 13 + 7);
    const catData = data?.categories?.[i];
    const base = catData ? catData.score / 100 : [0.76, 0.49, 0.58, 0.68, 0.84][i];
    return Array.from({ length: MONTHS }).map((_, j) => {
      const drift = (j / MONTHS) * 0.2;
      return Math.max(0.05, Math.min(0.98, base + drift + (r() - 0.5) * 0.18));
    });
  }), [data, monthly]);

  const usingRealData = monthly.length >= 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>

        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexDirection: isRtl ? 'row-reverse' : 'row',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ flex: '1 1 300px', textAlign: isRtl ? 'right' : 'left' }}>
            <div className="bi-eyebrow">{t('indicators.title')}</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--ink-1)' }}>
              {t('indicators.subtitle', { count: INDICATORS.length })}
            </h1>
          </div>
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            flexDirection: isRtl ? 'row-reverse' : 'row'
          }}>
            {usingRealData && (
              <span className="mono" style={{ fontSize: 10, color: 'var(--t-3)', letterSpacing: '0.08em' }}>
                {t('indicators.liveData', { count: sorted.length })}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>{t('indicators.scale')}</div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{t('indicators.stable')}</span>
              <div style={{ width: 120, height: 8, borderRadius: 4, background: 'linear-gradient(to right, var(--t-1), var(--t-3), var(--t-5), var(--t-7), var(--t-9))' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{t('indicators.bubble')}</span>
            </div>
          </div>
        </div>

        {/* Mobile View Container */}
        <div className="indicators-mobile-view" style={{ display: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {INDICATORS.map((ind, i) => {
              const last = grid[i][grid[i].length - 1];
              const prev = grid[i][Math.max(0, grid[i].length - 2)];
              const delta = (last - prev) * 100;
              return (
                <div key={ind.key} className="bi-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isRtl ? 'row-reverse' : 'row', gap: 12 }}>
                    <Link href={`/methodology#method-${ind.key}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <h3 style={{ fontSize: 14, color: 'var(--ink-1)', fontWeight: 600, margin: 0 }}>{t(`indicators.rowLabels.${ind.key}.name`)}</h3>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2, letterSpacing: '0.04em' }}>
                        {t(`indicators.rowLabels.${ind.key}.desc`)}
                      </div>
                    </Link>
                    <div style={{ textAlign: isRtl ? 'left' : 'right', flexShrink: 0 }}>
                      <div className="mono tnum" style={{ fontSize: 22, color: tempVar(last * 100), fontWeight: 500, lineHeight: 1 }}>{Math.round(last * 100)}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginTop: 2, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <Delta value={delta} suffix="pt" />
                        <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>{t('common.oneMonth')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dots Row */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="mono" style={{ display: 'grid', gridTemplateColumns: `repeat(${MONTHS}, 1fr)`, gap: 3, fontSize: 9, color: 'var(--ink-4)', marginBottom: 4, letterSpacing: '0.02em', direction: 'ltr' }}>
                      {Array.from({ length: MONTHS }).map((_, j) => {
                        if (usingRealData && monthly.length >= MONTHS) {
                          const snap = monthly[monthly.length - MONTHS + j];
                          const mo = snap?.snapshot_date?.slice(5, 7);
                          return <div key={j} style={{ textAlign: 'center' }}>{j % 3 === 0 && mo ? mo : ''}</div>;
                        }
                        return <div key={j} style={{ textAlign: 'center' }}>{j % 3 === 0 ? `M${MONTHS - j}` : ''}</div>;
                      })}
                    </div>
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.018, delayChildren: i * 0.05 } } }}
                      style={{ display: 'grid', gridTemplateColumns: `repeat(${MONTHS}, 1fr)`, gap: 3, direction: 'ltr' }}
                    >
                      {grid[i].map((v, j) => {
                        const dateLabel = usingRealData && monthly[monthly.length - MONTHS + j]
                          ? monthly[monthly.length - MONTHS + j].snapshot_date
                          : (isRtl ? `ח${MONTHS - j}` : `M${MONTHS - j}`);
                        const localizedName = t(`indicators.rowLabels.${INDICATORS[i].key}.name`);
                        const tooltipText = `${localizedName} · ${dateLabel} · ${t('common.score')} ${Math.round(v * 100)}`;
                        return (
                          <motion.div
                            key={j}
                            variants={{
                              hidden: { opacity: 0, scale: 0.7 },
                              show:   { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
                            }}
                          >
                            <HeatCell value={v} tooltip={tooltipText} />
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop View Container */}
        <div className="indicators-desktop-view bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isRtl ? '130px minmax(0, 1fr) 180px' : '180px minmax(0, 1fr) 130px', gap: 16, minHeight: 0 }}>

            {/* Row labels */}
            <div style={{ gridColumn: isRtl ? 3 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingTop: 26 }}>
              {INDICATORS.map((ind) => (
                <Link key={ind.key} href={`/methodology#method-${ind.key}`} className="bi-hoverable" style={{ cursor: 'pointer', borderRadius: 6, padding: '4px 6px', textAlign: isRtl ? 'right' : 'left', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <h3 style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500, margin: 0 }}>{t(`indicators.rowLabels.${ind.key}.name`)}</h3>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 3, letterSpacing: '0.04em' }}>
                    {isRtl ? t(`indicators.rowLabels.${ind.key}.desc`) : t(`indicators.rowLabels.${ind.key}.desc`).toUpperCase()}
                  </div>
                </Link>
              ))}
            </div>

            {/* Heatmap grid */}
            <div style={{ gridColumn: 2, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="mono" style={{ display: 'grid', gridTemplateColumns: `repeat(${MONTHS}, 1fr)`, gap: 3, fontSize: 10, color: 'var(--ink-4)', marginBottom: 6, letterSpacing: '0.04em', direction: 'ltr' }}>
                {Array.from({ length: MONTHS }).map((_, j) => {
                  if (usingRealData && monthly.length >= MONTHS) {
                    const snap = monthly[monthly.length - MONTHS + j];
                    const mo = snap?.snapshot_date?.slice(5, 7);
                    return <div key={j} style={{ textAlign: 'center' }}>{j % 3 === 0 && mo ? mo : ''}</div>;
                  }
                  return <div key={j} style={{ textAlign: 'center' }}>{j % 3 === 0 ? `M${MONTHS - j}` : ''}</div>;
                })}
              </div>
              {grid.map((row, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.018, delayChildren: i * 0.05 } } }}
                  style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${MONTHS}, 1fr)`, gap: 3, marginBottom: 3, direction: 'ltr' }}
                >
                  {row.map((v, j) => {
                    const dateLabel = usingRealData && monthly[monthly.length - MONTHS + j]
                      ? monthly[monthly.length - MONTHS + j].snapshot_date
                      : (isRtl ? `ח${MONTHS - j}` : `M${MONTHS - j}`);
                    const localizedName = t(`indicators.rowLabels.${INDICATORS[i].key}.name`);
                    const tooltipText = `${localizedName} · ${dateLabel} · ${t('common.score')} ${Math.round(v * 100)}`;
                    return (
                      <motion.div
                        key={j}
                        variants={{
                          hidden: { opacity: 0, scale: 0.7 },
                          show:   { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
                        }}
                      >
                        <HeatCell value={v} tooltip={tooltipText} />
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
            </div>

            {/* Current values */}
            <div style={{ gridColumn: isRtl ? 1 : 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', borderRight: isRtl ? '1px solid var(--hairline)' : 'none', borderLeft: isRtl ? 'none' : '1px solid var(--hairline)', paddingRight: isRtl ? 16 : 0, paddingLeft: isRtl ? 0 : 16 } as React.CSSProperties}>
              {INDICATORS.map((ind, i) => {
                const last = grid[i][grid[i].length - 1];
                const prev = grid[i][Math.max(0, grid[i].length - 2)];
                const delta = (last - prev) * 100;
                return (
                  <div key={ind.key} style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    <div className="mono tnum" style={{ fontSize: 26, color: tempVar(last * 100), fontWeight: 500, lineHeight: 1 }}>{Math.round(last * 100)}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 4, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                      <Delta value={delta} suffix="pt" />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>{t('common.oneMonth')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
      <style jsx global>{`
        .indicators-mobile-view {
          display: none !important;
        }
        .indicators-desktop-view {
          display: flex !important;
        }
        @media (max-width: 767px) {
          .indicators-mobile-view {
            display: flex !important;
          }
          .indicators-desktop-view {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
