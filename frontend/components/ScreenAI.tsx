'use client';
import Topbar from './Topbar';
import { Radar, VerdictPill } from './Primitives';
import { riskTier } from '@/lib/utils';
import type { RiskScoreResponse, Palette } from '@/lib/types';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
}

const INSIGHTS = [
  { tag: 'CONCENTRATION', verb: 'SELL',    categoryId: 'concentration',    text: 'Top-10 names = 38% of S&P cap. Last reading this high was Feb 2000.' },
  { tag: 'VALUATION',     verb: 'CAUTION', categoryId: 'valuation',        text: 'CAPE at elevated levels — above the 50-year mean. Reverts within 4y in 92% of cases.' },
  { tag: 'LEVERAGE',      verb: 'HOLD',    categoryId: 'leverage_credit',  text: 'Fed balance sheet contracting, but M2 still above pre-pandemic trend.' },
  { tag: 'SENTIMENT',     verb: 'WATCH',   categoryId: 'sentiment',        text: 'AAII bullish reading elevated. Margin debt rising year-over-year.' },
];

const VERB_SCORE: Record<string, number> = { SELL: 90, CAUTION: 70, WATCH: 50, HOLD: 30, BUY: 10 };

export default function ScreenAI({ data, palette, onCyclePalette, onNavigate }: Props) {
  const score = data?.composite_score ?? 72;
  const tier = riskTier(score);
  const cats = data?.categories ?? [];
  const radarVals = cats.length >= 5
    ? cats.map(c => c.score / 100)
    : [0.78, 0.62, 0.42, 0.71, 0.51];
  const axes = cats.length >= 5
    ? cats.map(c => c.display_name.slice(0, 4).toUpperCase())
    : ['VAL', 'MAC', 'LEV', 'SEN', 'CON'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="ai" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 'var(--gap-grid)', minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT — headline + feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>
          <div>
            <div className="bi-eyebrow">AI INSIGHTS · {new Date().toDateString().toUpperCase()}</div>
            <div style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.1, color: 'var(--ink-1)' }}>
              The market shows
              <span style={{ color: tier.tone, fontWeight: 500 }}> {tier.tier.toLowerCase()} </span>
              risk across multiple dimensions.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflow: 'auto' }}>
            {INSIGHTS.map((ins, i) => {
              const t = riskTier(VERB_SCORE[ins.verb] ?? 50);
              return (
                <div key={i} className="bi-card bi-hoverable" onClick={() => onNavigate(`methodology:${ins.categoryId}`)} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px', gap: 18, alignItems: 'center', cursor: 'pointer' }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.16em' }}>{ins.tag}</div>
                  <div style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.4 }}>{ins.text}</div>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', fontWeight: 600, color: t.tone, textAlign: 'right' }}>{ins.verb}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — radar + verdict */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>
          <div className="bi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>RISK FOOTPRINT</div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em' }}>VS 50Y AVG</span>
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <Radar axes={axes} values={radarVals} size={280} />
            </div>
          </div>

          <div className="bi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>VERDICT</div>
              <VerdictPill score={score} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div className="bi-bignum" style={{ fontSize: 64, color: 'var(--ink-1)' }}>{score}</div>
              <div>
                <div className="mono" style={{ fontSize: 11, color: tier.tone, fontWeight: 600, letterSpacing: '0.18em' }}>{tier.tier}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em', marginTop: 3 }}>COMPOSITE SCORE</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 8 }}>
              <div className="bi-eyebrow" style={{ fontSize: 9 }}>RECOMMENDED ACTION</div>
              <div style={{ fontSize: 13, color: 'var(--ink-1)', marginTop: 5, lineHeight: 1.4 }}>
                {tier.tier === 'BUBBLE' || tier.tier === 'HIGH'
                  ? 'Trim concentrated growth exposure. Rotate 15–20% into short-duration sovereign.'
                  : tier.tier === 'ELEVATED'
                    ? 'Monitor risk indicators closely. Maintain defensive positioning.'
                    : 'Conditions are within historical norms. No immediate action required.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

