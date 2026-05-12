'use client';
import { useMemo } from 'react';
import Topbar from './Topbar';
import { HeatCell, Delta } from './Primitives';
import { tempVar } from '@/lib/utils';
import type { RiskScoreResponse, Palette } from '@/lib/types';

const INDICATORS = [
  { key: 'valuation',       name: 'Valuation',     desc: 'CAPE, P/E vs history' },
  { key: 'macro_stress',    name: 'Macro',         desc: 'Yield curve, PMI' },
  { key: 'leverage_credit', name: 'Leverage',      desc: 'Margin debt, corp. debt' },
  { key: 'sentiment',       name: 'Sentiment',     desc: 'Retail flows, surveys' },
  { key: 'concentration',   name: 'Concentration', desc: 'Top-10 share of cap' },
];

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
}

export default function ScreenIndicators({ data, palette, onCyclePalette, onNavigate }: Props) {
  const months = 24;
  const rng = (s: number) => { let x = s; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };

  const grid = useMemo(() => INDICATORS.map((ind, i) => {
    const r = rng(i * 13 + 7);
    const catData = data?.categories?.[i];
    const base = catData ? catData.score / 100 : [0.76, 0.49, 0.58, 0.68, 0.84][i];
    return Array.from({ length: months }).map((_, j) => {
      const drift = (j / months) * 0.2;
      return Math.max(0.05, Math.min(0.98, base + drift + (r() - 0.5) * 0.18));
    });
  }), [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="indicators" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="bi-eyebrow">INDICATORS EXPLORER</div>
            <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--ink-1)' }}>
              {INDICATORS.length} dimensions of bubble risk, scored monthly.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.14em' }}>SCALE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>STABLE</span>
              <div style={{ width: 180, height: 8, borderRadius: 4, background: 'linear-gradient(to right, var(--t-1), var(--t-3), var(--t-5), var(--t-7), var(--t-9))' }} />
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>BUBBLE</span>
            </div>
          </div>
        </div>

        <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: 16, minHeight: 0 }}>
            {/* Row labels */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingTop: 18 }}>
              {INDICATORS.map((ind) => (
                <div key={ind.key}>
                  <div style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>{ind.name}</div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 2, letterSpacing: '0.06em' }}>{ind.desc.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="mono" style={{ display: 'grid', gridTemplateColumns: `repeat(${months}, 1fr)`, gap: 3, fontSize: 8.5, color: 'var(--ink-4)', marginBottom: 6, letterSpacing: '0.04em' }}>
                {Array.from({ length: months }).map((_, j) => (
                  <div key={j} style={{ textAlign: 'center' }}>{j % 3 === 0 ? `M${months - j}` : ''}</div>
                ))}
              </div>
              {grid.map((row, i) => (
                <div key={i} style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${months}, 1fr)`, gap: 3, marginBottom: 3 }}>
                  {row.map((v, j) => <HeatCell key={j} value={v} tooltip={`${INDICATORS[i].name} · M${months - j} · score ${Math.round(v * 100)}`} />)}
                </div>
              ))}
            </div>

            {/* Current values */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', borderLeft: '1px solid var(--hairline)', paddingLeft: 14 }}>
              {INDICATORS.map((ind, i) => {
                const last = grid[i][grid[i].length - 1];
                const prev = grid[i][Math.max(0, grid[i].length - 7)];
                const delta = (last - prev) * 100;
                return (
                  <div key={ind.key}>
                    <div className="mono tnum" style={{ fontSize: 26, color: tempVar(last * 100), fontWeight: 500, lineHeight: 1 }}>{Math.round(last * 100)}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 4 }}>
                      <Delta value={delta} suffix="pt" />
                      <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>7D</span>
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

