'use client';
import { useMemo, useState } from 'react';
import Topbar from './Topbar';
import { tempVar } from '@/lib/utils';
import { riskTier } from '@/lib/utils';
import type { RiskScoreResponse, SnapshotSummary, Palette } from '@/lib/types';

interface Props {
  data: RiskScoreResponse | null;
  snapshots: SnapshotSummary[];
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
  onOpenTweaks?: () => void;
}

const TIME_RANGES = ['1Y', '5Y', '10Y', '25Y', 'All'] as const;
type TimeRange = typeof TIME_RANGES[number];

const RANGE_DAYS: Record<TimeRange, number> = {
  '1Y': 365, '5Y': 1825, '10Y': 3650, '25Y': 9125, 'All': 99999,
};

const CRISIS_MARKERS = [
  { year: 1929, label: '1929' },
  { year: 1973, label: '1973' },
  { year: 1987, label: '1987' },
  { year: 2000, label: '2000' },
  { year: 2008, label: '2008' },
  { year: 2020, label: '2020' },
  { year: 2022, label: '2022' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function filterByRange(snapshots: SnapshotSummary[], range: TimeRange): SnapshotSummary[] {
  const cutoff = new Date(Date.now() - RANGE_DAYS[range] * 86400000);
  return snapshots.filter(s => new Date(s.snapshot_date) >= cutoff);
}

export default function ScreenHistorical({ data, snapshots, palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
  const [activeRange, setActiveRange] = useState<TimeRange>('All');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const similarities = data?.crisis_similarities ?? [];
  const topSimilar = similarities[0];

  const filtered = useMemo(() => filterByRange(snapshots, activeRange), [snapshots, activeRange]);

  const years = useMemo(() => {
    const set = new Set(snapshots.map(s => s.snapshot_date.slice(0, 4)));
    return Array.from(set).sort().reverse();
  }, [snapshots]);

  const monthsForYear = useMemo(() =>
    snapshots
      .filter(s => s.snapshot_date.startsWith(selectedYear))
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
  [snapshots, selectedYear]);

  const detailSnap = useMemo(() =>
    selectedDate ? snapshots.find(s => s.snapshot_date === selectedDate) ?? null : null,
  [snapshots, selectedDate]);

  // SVG chart path from real data
  const chartPath = useMemo(() => {
    if (filtered.length < 2) return '';
    return filtered.map((s, i) => {
      const x = 40 + (i / (filtered.length - 1)) * 750;
      const y = 30 + (1 - s.composite_score / 100) * 240;
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  }, [filtered]);

  // Crisis marker X positions
  const crisisMarkers = useMemo(() => {
    if (filtered.length < 2) return [];
    const first = new Date(filtered[0].snapshot_date).getTime();
    const last = new Date(filtered[filtered.length - 1].snapshot_date).getTime();
    const span = last - first;
    return CRISIS_MARKERS.flatMap(m => {
      const t = new Date(`${m.year}-06-01`).getTime();
      if (t < first || t > last) return [];
      const x = 40 + ((t - first) / span) * 750;
      return [{ ...m, x }];
    });
  }, [filtered]);

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
                  ? <>Closest analog: <span style={{ color: 'var(--t-8)', fontWeight: 500 }}>{topSimilar.display_name}</span>.</>
                  : 'BubbleIndex risk score — 1990 to today.'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>
                {filtered.length > 0
                  ? `${filtered.length} monthly snapshots · ${filtered[0]?.snapshot_date} → ${filtered[filtered.length - 1]?.snapshot_date}`
                  : 'No historical data yet — run backfill_history.py'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {TIME_RANGES.map((l) => (
                <button key={l} onClick={() => setActiveRange(l)} style={{
                  padding: '7px 14px', border: '1px solid var(--hairline)', borderRadius: 6,
                  fontSize: 12, color: activeRange === l ? 'var(--ink-1)' : 'var(--ink-3)',
                  fontFamily: 'var(--font-mono)', background: activeRange === l ? 'var(--panel-3)' : 'var(--panel)',
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>RISK SCORE · HISTORY</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>MONTHLY · PERCENTILE-BASED</div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg viewBox="0 0 800 320" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
                {[0,1,2,3,4].map((i) => (
                  <line key={i} x1="40" x2="790" y1={30 + i * 60} y2={30 + i * 60} stroke="var(--hairline)" strokeDasharray="2 4" />
                ))}
                {[0,25,50,75,100].map((m, i) => (
                  <text key={m} x="30" y={30 + (4-i)*60+3} fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor="end">{m}</text>
                ))}
                <rect x="40" y="30" width="750" height="60" fill="var(--t-8)" opacity="0.05" />
                <text x="60" y="52" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.12em" fill="var(--t-8)" opacity="0.8">BUBBLE · 75+</text>

                {/* Crisis markers */}
                {crisisMarkers.map(m => (
                  <g key={m.year}>
                    <line x1={m.x} x2={m.x} y1="30" y2="270" stroke="var(--hairline-2)" strokeDasharray="3 3" strokeWidth="1" />
                    <text x={m.x} y="285" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor="middle">{m.label}</text>
                  </g>
                ))}

                {/* Real data line */}
                {chartPath && (
                  <path d={chartPath} fill="none" stroke="var(--ink-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                )}

                {/* Highlight selected date */}
                {selectedDate && filtered.length >= 2 && (() => {
                  const idx = filtered.findIndex(s => s.snapshot_date === selectedDate);
                  if (idx < 0) return null;
                  const x = 40 + (idx / (filtered.length - 1)) * 750;
                  const y = 30 + (1 - filtered[idx].composite_score / 100) * 240;
                  return (
                    <g>
                      <line x1={x} x2={x} y1="30" y2="270" stroke="var(--t-7)" strokeWidth="1.5" />
                      <circle cx={x} cy={y} r="5" fill="var(--t-7)" />
                    </g>
                  );
                })()}

                {filtered.length === 0 && (
                  <text x="400" y="160" fontSize="13" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor="middle">No data — run backfill_history.py first</text>
                )}
              </svg>
            </div>
          </div>

          {/* Month/Year selector */}
          <div className="bi-card">
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.10em', marginBottom: 12 }}>SELECT MONTH</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); setSelectedDate(null); }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--panel-2)', color: 'var(--ink-1)', border: '1px solid var(--hairline)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {monthsForYear.map(s => {
                  const month = parseInt(s.snapshot_date.slice(5, 7), 10) - 1;
                  const isSelected = selectedDate === s.snapshot_date;
                  const tone = tempVar(s.composite_score);
                  return (
                    <button
                      key={s.snapshot_date}
                      onClick={() => setSelectedDate(isSelected ? null : s.snapshot_date)}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 9px', borderRadius: 6,
                        border: `1px solid ${isSelected ? tone : 'var(--hairline)'}`,
                        background: isSelected ? `color-mix(in srgb, ${tone} 20%, var(--panel-2))` : 'var(--panel-2)',
                        color: isSelected ? tone : 'var(--ink-2)',
                        cursor: 'pointer', letterSpacing: '0.04em',
                      }}
                    >{MONTH_NAMES[month]}</button>
                  );
                })}
                {monthsForYear.length === 0 && (
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>No data for {selectedYear}</span>
                )}
              </div>
            </div>

            {/* Detail card */}
            {detailSnap && (
              <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--panel-3)', borderRadius: 8, border: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.10em' }}>{detailSnap.snapshot_date}</div>
                    <div className="mono" style={{ fontSize: 11, color: tempVar(detailSnap.composite_score), marginTop: 3, letterSpacing: '0.08em' }}>{riskTier(detailSnap.composite_score).tier}</div>
                  </div>
                  <div className="mono tnum" style={{ fontSize: 36, lineHeight: 1, color: tempVar(detailSnap.composite_score), fontWeight: 500 }}>
                    {detailSnap.composite_score.toFixed(1)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {[
                    { label: 'VAL',  score: detailSnap.valuation_score },
                    { label: 'MAC',  score: detailSnap.macro_stress_score },
                    { label: 'LEV',  score: detailSnap.leverage_credit_score },
                    { label: 'SEN',  score: detailSnap.sentiment_score },
                    { label: 'CON',  score: detailSnap.concentration_score },
                  ].map(cat => (
                    <div key={cat.label} style={{ textAlign: 'center' }}>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.06em', marginBottom: 4 }}>{cat.label}</div>
                      <div className="mono tnum" style={{ fontSize: 18, color: tempVar(cat.score), fontWeight: 500 }}>{cat.score.toFixed(0)}</div>
                      <div style={{ height: 3, background: 'var(--panel)', borderRadius: 2, marginTop: 4 }}>
                        <div style={{ width: `${cat.score}%`, height: '100%', background: tempVar(cat.score), borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
