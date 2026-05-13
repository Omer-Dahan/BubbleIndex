'use client';
import { useMemo, useState } from 'react';
import Topbar from './Topbar';
import { tempVar, makeSeries } from '@/lib/utils';
import type { RiskScoreResponse, Palette } from '@/lib/types';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
  onOpenTweaks?: () => void;
}

const TIME_RANGES = ['1Y', '5Y', '10Y', '25Y', 'All'] as const;
type TimeRange = typeof TIME_RANGES[number];

export default function ScreenHistorical({ data, palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
  const [activeRange, setActiveRange] = useState<TimeRange>('All');
  const similarities = data?.crisis_similarities ?? [];
  const seriesNow  = useMemo(() => makeSeries(140, 11, 0.05, 0.62), []);
  const series2000 = useMemo(() => makeSeries(140, 23, 0.04, 0.64), []);
  const series2008 = useMemo(() => makeSeries(140, 47, 0.05, 0.58), []);
  const series1929 = useMemo(() => makeSeries(140, 71, 0.06, 0.63), []);

  const topSimilar = similarities[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="historical" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--gap-grid)', minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div className="bi-eyebrow">HISTORICAL ANALYSIS</div>
              <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--ink-1)' }}>
                {topSimilar
                  ? <>The closest analog to today is <span style={{ color: 'var(--t-8)', fontWeight: 500 }}>{topSimilar.display_name}</span>.</>
                  : 'Pattern-matching across historical market cycles.'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>Pattern-match across 6 indicators · historical data</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {TIME_RANGES.map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveRange(l)}
                  style={{
                    padding: '7px 14px',
                    border: '1px solid var(--hairline)',
                    borderRadius: 6,
                    fontSize: 12,
                    color: activeRange === l ? 'var(--ink-1)' : 'var(--ink-3)',
                    fontFamily: 'var(--font-mono)',
                    background: activeRange === l ? 'var(--panel-3)' : 'var(--panel)',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                  }}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* Overlay chart */}
          <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>RISK SCORE · OVERLAY</div>
              <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                <span style={{ color: 'var(--ink-1)' }}>● TODAY</span>
                <span style={{ color: 'var(--t-8)' }}>● 2000</span>
                <span style={{ color: 'var(--t-5)' }}>● 2008</span>
                <span style={{ color: 'var(--t-3)' }}>● 1929</span>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg viewBox="0 0 800 320" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
                {[0,1,2,3,4].map((i) => (
                  <line key={i} x1="40" x2="790" y1={30 + i * 60} y2={30 + i * 60} stroke="var(--hairline)" strokeDasharray="2 4" />
                ))}
                {[0, 25, 50, 75, 100].map((m, i) => (
                  <text key={m} x="30" y={30 + (4 - i) * 60 + 3} fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor="end">{m}</text>
                ))}
                <rect x="40" y="30" width="750" height="60" fill="var(--t-8)" opacity="0.05" />
                <text x="60" y="52" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.12em" fill="var(--t-8)" opacity="0.8">BUBBLE TERRITORY · 75+</text>
                {[
                  { data: series1929, color: 'var(--t-3)', op: 0.7 },
                  { data: series2008, color: 'var(--t-5)', op: 0.7 },
                  { data: series2000, color: 'var(--t-8)', op: 0.85 },
                  { data: seriesNow,  color: 'var(--ink-1)', op: 1, w: 2.2 },
                ].map((line, k) => {
                  const d = line.data.map((v, i) => {
                    const x = 40 + (i / (line.data.length - 1)) * 750;
                    const y = 30 + (1 - v) * 240;
                    return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
                  }).join(' ');
                  return <path key={k} d={d} fill="none" stroke={line.color} opacity={line.op}
                    strokeWidth={line.w || 1.2} strokeLinecap="round" strokeLinejoin="round" />;
                })}
                <text x="780" y="290" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor="end">CYCLE MONTH →</text>
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT — similarity cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0, overflow: 'auto' }}>
          <div className="bi-eyebrow">HISTORICAL SIMILARITY</div>
          {(similarities.length > 0 ? similarities : [
            { crisis_id:'2000_dotcom', display_name:'2000 · Dot-com Bubble', peak_score:94, drawdown_pct:-78, similarity_score:82 },
            { crisis_id:'1929_crash',  display_name:'1929 · Wall St. Crash',  peak_score:89, drawdown_pct:-89, similarity_score:64 },
            { crisis_id:'2021_meme',   display_name:'2021 · Meme / SPAC Era', peak_score:86, drawdown_pct:-25, similarity_score:71 },
            { crisis_id:'2007_gfc',    display_name:'2008 · Subprime / GFC',  peak_score:81, drawdown_pct:-57, similarity_score:41 },
            { crisis_id:'2020_covid',  display_name:'2020 · Covid Crash',     peak_score:67, drawdown_pct:-34, similarity_score:22 },
          ] as any[]).map((era) => (
            <div key={era.crisis_id} className="bi-card bi-hoverable" style={{ padding: 'calc(var(--pad-card) * 0.66)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-1)' }}>{era.display_name}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4, letterSpacing: '0.06em' }}>
                    PEAK {era.peak_score} · DRAWDOWN {era.drawdown_pct}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono tnum" style={{ fontSize: 22, color: tempVar(era.similarity_score), fontWeight: 500 }}>
                    {era.similarity_score}<span style={{ fontSize: 13, color: 'var(--ink-4)' }}>%</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em', marginTop: 2 }}>SIMILARITY</div>
                </div>
              </div>
              <div style={{ height: 3, marginTop: 12, background: 'var(--panel-3)', borderRadius: 2 }}>
                <div style={{ width: `${era.similarity_score}%`, height: '100%', background: tempVar(era.similarity_score), borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
