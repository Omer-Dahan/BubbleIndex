'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Topbar from './Topbar';
import { HeatCell, Delta } from './Primitives';
import { tempVar } from '@/lib/utils';
import type { RiskScoreResponse, SnapshotSummary, Palette } from '@/lib/types';

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
  onNavigate: (s: string) => void;
  onOpenTweaks?: () => void;
}

// Seeded PRNG fallback for when no real historical data is available
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export default function ScreenIndicators({ data, snapshots, palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
  const sorted = useMemo(() =>
    [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
  [snapshots]);

  // Build heatmap from real snapshot history; fall back to simulated if insufficient data
  const grid = useMemo(() => INDICATORS.map((ind, i) => {
    const last24 = sorted.slice(-MONTHS);
    if (last24.length >= 4) {
      // Pad left with the oldest value if fewer than MONTHS snapshots
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
  }), [data, sorted]);

  const usingRealData = sorted.length >= 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="indicators" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="bi-eyebrow">INDICATORS EXPLORER</div>
            <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--ink-1)' }}>
              {INDICATORS.length} dimensions of bubble risk, scored monthly.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {usingRealData && (
              <span className="mono" style={{ fontSize: 10, color: 'var(--t-3)', letterSpacing: '0.08em' }}>
                LIVE DATA · {sorted.length} MONTHS
              </span>
            )}
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>SCALE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>STABLE</span>
              <div style={{ width: 180, height: 8, borderRadius: 4, background: 'linear-gradient(to right, var(--t-1), var(--t-3), var(--t-5), var(--t-7), var(--t-9))' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>BUBBLE</span>
            </div>
          </div>
        </div>

        <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '180px 1fr 130px', gap: 16, minHeight: 0 }}>

            {/* Row labels */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingTop: 26 }}>
              {INDICATORS.map((ind) => (
                <div key={ind.key} className="bi-hoverable" onClick={() => onNavigate(`methodology:${ind.key}`)} style={{ cursor: 'pointer', borderRadius: 6, padding: '4px 6px' }}>
                  <div style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>{ind.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 3, letterSpacing: '0.04em' }}>{ind.desc.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Column headers */}
              <div className="mono" style={{ display: 'grid', gridTemplateColumns: `repeat(${MONTHS}, 1fr)`, gap: 3, fontSize: 10, color: 'var(--ink-4)', marginBottom: 6, letterSpacing: '0.04em' }}>
                {Array.from({ length: MONTHS }).map((_, j) => {
                  // Show month label relative to oldest snapshot when using real data
                  if (usingRealData && sorted.length >= MONTHS) {
                    const snap = sorted[sorted.length - MONTHS + j];
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
                  style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${MONTHS}, 1fr)`, gap: 3, marginBottom: 3 }}
                >
                  {row.map((v, j) => (
                    <motion.div
                      key={j}
                      variants={{
                        hidden: { opacity: 0, scale: 0.7 },
                        show:   { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
                      }}
                    >
                      <HeatCell value={v} tooltip={`${INDICATORS[i].name} · ${usingRealData && sorted[sorted.length - MONTHS + j] ? sorted[sorted.length - MONTHS + j].snapshot_date : `M${MONTHS - j}`} · score ${Math.round(v * 100)}`} />
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </div>

            {/* Current values */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', borderLeft: '1px solid var(--hairline)', paddingLeft: 16 }}>
              {INDICATORS.map((ind, i) => {
                const last = grid[i][grid[i].length - 1];
                const prev = grid[i][Math.max(0, grid[i].length - 2)];
                const delta = (last - prev) * 100;
                return (
                  <div key={ind.key}>
                    <div className="mono tnum" style={{ fontSize: 26, color: tempVar(last * 100), fontWeight: 500, lineHeight: 1 }}>{Math.round(last * 100)}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 4 }}>
                      <Delta value={delta} suffix="pt" />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>1M</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
