'use client';
import { useMemo } from 'react';
import Gauge from './Gauge';
import { Sparkline, VerdictPill, Delta } from './Primitives';
import Topbar from './Topbar';
import { riskTier, tempVar, makeSeries } from '@/lib/utils';
import type { RiskScoreResponse, SnapshotSummary, GaugeKind, Palette } from '@/lib/types';


const CATEGORY_KEYS: (keyof SnapshotSummary)[] = [
  'valuation_score', 'macro_stress_score', 'leverage_credit_score', 'sentiment_score', 'concentration_score',
];

interface Props {
  data: RiskScoreResponse | null;
  snapshots: SnapshotSummary[];
  gaugeKind: GaugeKind;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
  onOpenTweaks?: () => void;
}

export default function ScreenHome({ data, snapshots, gaugeKind, palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
  const score = data?.composite_score ?? 72;
  const tier = riskTier(score);

  const subscores = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    return (data?.categories ?? []).map((cat, i) => {
      const value = Math.round(cat.score);
      const median = [54, 49, 51, 50, 48][i] ?? 50;
      const key = CATEGORY_KEYS[i];
      let trend: number[];
      if (sorted.length >= 2) {
        const raw = sorted.map(s => (s[key] as number) / 100);
        trend = raw;
      } else {
        const rawTrend = makeSeries(24, (i + 1) * 13, 0.07, value / 100);
        trend = [...rawTrend.slice(0, -1), value / 100];
      }
      const deltaMo = trend.length >= 30
        ? Math.round((trend[trend.length - 1] - trend[trend.length - 30]) * 100)
        : [+8, +4, -3, +12, +6][i] ?? 0;
      return { ...cat, value, median, deltaMo, trend };
    });
  }, [data, snapshots]);

  const closest = data?.crisis_similarities?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="home" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} onOpenTweaks={onOpenTweaks} />
      <div style={{
        flex: 1, padding: 'var(--pad-screen)',
        display: 'grid', gridTemplateColumns: '460px 1fr',
        gap: 'var(--gap-grid)', minHeight: 0, overflow: 'hidden',
      }}>

        {/* LEFT — gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
          <div className="bi-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div className="bi-eyebrow">MARKET RISK · LIVE</div>
                <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4, color: 'var(--ink-1)' }}>S&P 500 Composite</div>
              </div>
              <VerdictPill score={score} />
            </div>
            <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
              <Gauge kind={gaugeKind} score={score} size={gaugeKind === 'bar' ? undefined : 360} />
            </div>
            {/* Delta stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, marginTop: 14, background: 'var(--hairline)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' }}>
              {([['7D Δ', '+4.2'], ['30D Δ', '+11.8'], ['90D Δ', '+18.6']] as [string, string][]).map(([label, val]) => (
                <div key={label} style={{ padding: '12px 14px', background: 'var(--panel)' }}>
                  <div className="bi-eyebrow">{label}</div>
                  <div className="mono tnum" style={{ fontSize: 18, marginTop: 5, color: 'var(--ink-1)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>

          {/* AI Brief */}
          <div className="bi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>AI MARKET BRIEF</div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>
                {data?.snapshot_date ? `AS OF ${data.snapshot_date}` : 'LOADING...'}
              </span>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-1)', margin: 0, fontWeight: 400 }}>
              Market is in <span style={{ color: tier.tone, fontWeight: 600 }}>{tier.tier.toLowerCase()}</span> territory.
              {data?.categories?.[4]?.score && data.categories[4].score > 60
                ? ' Concentration risk elevated — top-10 stocks dominate S&P cap weight.'
                : ' Macro stress indicators rising — monitor yield curve and credit spreads.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
              {[
                ['VERDICT',        tier.verb,                              tier.tone],
                ['CLOSEST ANALOG', closest?.display_name?.split('·')[0]?.trim() ?? '—', 'var(--ink-1)'],
                ['SIMILARITY',     closest ? `${closest.similarity_score}%` : '—', 'var(--ink-1)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ padding: '10px 12px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)' }}>
                  <div className="bi-eyebrow">{label}</div>
                  <div className="mono" style={{ fontSize: 13, marginTop: 5, color, fontWeight: 600, letterSpacing: '0.06em' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk breakdown */}
          <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>RISK BREAKDOWN · {subscores.length} CATEGORIES</div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>VS 50Y MEDIAN · 24M TREND</span>
            </div>
            {/* 5 cards: 3 on top row, 2 centred on bottom row */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, flex: '1 1 0' }}>
                {subscores.slice(0, 3).map((s) => <RiskCard key={s.id} s={s} onNavigate={onNavigate} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: '1 1 0' }}>
                {subscores.slice(3).map((s) => <RiskCard key={s.id} s={s} onNavigate={onNavigate} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SubscoreItem = { id: string; display_name: string; weight: number; value: number; median: number; deltaMo: number; trend: number[] };

function RiskCard({ s, onNavigate }: { s: SubscoreItem; onNavigate: (s: string) => void }) {
  const tone = tempVar(s.value);
  const above = s.value > s.median;
  return (
    <div className="bi-hoverable" onClick={() => onNavigate(`methodology:${s.id}`)} style={{ padding: '14px 16px', border: '1px solid var(--hairline)', borderRadius: 10, background: 'var(--panel-2)', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>{s.display_name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3, letterSpacing: '0.04em' }}>
            {(s.weight * 100).toFixed(0)}% WEIGHT
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono tnum" style={{ fontSize: 22, lineHeight: 1, color: tone, fontWeight: 500, letterSpacing: '-0.02em' }}>{s.value}</div>
          <div className="mono tnum" style={{ fontSize: 11, marginTop: 4, color: above ? 'var(--t-8)' : 'var(--t-3)', fontWeight: 600, letterSpacing: '0.04em' }}>
            {above ? '▲' : '▼'} {Math.abs(s.value - s.median)} VS MED
          </div>
        </div>
      </div>
      {/* Progress bar — extra top margin so the MED badge fits */}
      <div style={{ position: 'relative', height: 6, background: 'var(--panel-3)', borderRadius: 3, marginTop: 18 }}>
        <div style={{ width: `${s.value}%`, height: '100%', background: tone, borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: `${s.median}%`, top: -4, bottom: -4, width: 2, background: 'var(--ink-2)', borderRadius: 1 }} />
        <div style={{
          position: 'absolute', left: `${s.median}%`, bottom: 10, transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-2)',
          background: 'var(--panel-3)', border: '1px solid var(--hairline-2)',
          borderRadius: 3, padding: '1px 4px', letterSpacing: '0.06em', whiteSpace: 'nowrap',
        }}>MED</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Sparkline data={s.trend} h={28} stroke={tone} fill fluid yMin={0} yMax={1} />
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>30D</div>
          <div className="mono tnum" style={{ fontSize: 14, color: s.deltaMo >= 0 ? 'var(--t-8)' : 'var(--t-3)', fontWeight: 600 }}>
            {s.deltaMo >= 0 ? '+' : ''}{s.deltaMo}
          </div>
        </div>
      </div>
    </div>
  );
}

