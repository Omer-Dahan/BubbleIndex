'use client';
import { useEffect, useRef } from 'react';
import Topbar from './Topbar';
import { tempVar } from '@/lib/utils';
import type { RiskScoreResponse, CategoryScore, Palette } from '@/lib/types';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
  focusCategory?: string;
  onOpenTweaks?: () => void;
}

const STATIC_CATEGORIES = [
  {
    id: 'valuation',
    display_name: 'Valuation',
    weight: 0.30,
    score: null as number | null,
    summary: 'Is the market overvalued relative to history and to actual economic output?',
    why: 'High valuations historically precede major corrections — mean-reversion is the strongest single signal across 124 years.',
  },
  {
    id: 'macro_stress',
    display_name: 'Macro Stress',
    weight: 0.20,
    score: null as number | null,
    summary: 'How healthy is the broader economy, and is monetary policy tightening into a slowdown?',
    why: 'Inverted yield curves have preceded every US recession since 1955. Macro stress is a leading indicator on a 6–18 month lag.',
  },
  {
    id: 'leverage_credit',
    display_name: 'Leverage & Credit',
    weight: 0.20,
    score: null as number | null,
    summary: 'How much systemic leverage and credit stress is embedded in the market right now?',
    why: 'Bubbles pop when leveraged players are forced to unwind. Credit spreads widen weeks before equity drawdowns.',
  },
  {
    id: 'sentiment',
    display_name: 'Sentiment',
    weight: 0.15,
    score: null as number | null,
    summary: 'Is fear or euphoria the dominant mood among market participants?',
    why: 'Sentiment extremes are contrarian signals. The trend in fear matters more than the absolute level.',
  },
  {
    id: 'concentration',
    display_name: 'Concentration',
    weight: 0.15,
    score: null as number | null,
    summary: 'How fragile is the index? Does performance rely on a handful of mega-caps?',
    why: 'When 10 stocks drive an index, a shock in one sector takes the whole market down.',
  },
];

function mergeWithLive(cats: CategoryScore[] | undefined) {
  return STATIC_CATEGORIES.map((s) => {
    const live = cats?.find((c) => c.id === s.id);
    return {
      ...s,
      score: live ? Math.round(live.score) : null,
      weight: live ? live.weight : s.weight,
      indicators: live?.indicators ?? [],
    };
  });
}

function CategoryCard({
  cat,
  compositeScore,
  focused,
  onOpenDetail,
}: {
  cat: ReturnType<typeof mergeWithLive>[number];
  compositeScore: number;
  focused: boolean;
  onOpenDetail: (id: string) => void;
}) {
  const tone = cat.score !== null ? tempVar(cat.score) : 'var(--ink-3)';
  const weightPct = Math.round(cat.weight * 100);
  const contribution = cat.score !== null ? (cat.score * weightPct / 100).toFixed(1) : '—';

  return (
    <div
      id={`method-${cat.id}`}
      className="bi-card bi-hoverable"
      onClick={() => onOpenDetail(cat.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        paddingLeft: 'calc(var(--pad-card) + 4px)',
        outline: focused ? `2px solid ${tone}` : 'none',
        outlineOffset: 2,
        transition: 'outline 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: tone, opacity: 0.85, borderRadius: 2 }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--ink-1)', letterSpacing: '-0.01em' }}>{cat.display_name}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 10, padding: '12px 0', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}>
        <div>
          <div className="bi-eyebrow" style={{ fontSize: 9 }}>WEIGHT</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <div className="mono tnum" style={{ fontSize: 26, fontWeight: 300, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>{weightPct}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>%</div>
          </div>
        </div>
        <div>
          <div className="bi-eyebrow" style={{ fontSize: 9 }}>SCORE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <div className="mono tnum" style={{ fontSize: 26, fontWeight: 500, color: tone, letterSpacing: '-0.02em' }}>
              {cat.score !== null ? cat.score : '—'}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>/ 100</div>
          </div>
        </div>
        <div>
          <div className="bi-eyebrow" style={{ fontSize: 9 }}>CONTRIBUTION</div>
          <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>
            {cat.score !== null
              ? <>{contribution}<span style={{ color: 'var(--ink-4)' }}> pts / {compositeScore}</span></>
              : '—'
            }
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.5, textWrap: 'pretty' } as React.CSSProperties}>{cat.summary}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5, marginTop: 8, textWrap: 'pretty' } as React.CSSProperties}>{cat.why}</div>
      </div>

      {cat.indicators.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="bi-eyebrow" style={{ fontSize: 9 }}>LIVE INPUTS</div>
          {cat.indicators.map((ind) => (
            <div key={ind.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'baseline', padding: '6px 0', borderTop: '1px solid var(--hairline)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-1)', fontWeight: 500 }}>{ind.display_name}</div>
                  <div className="mono" style={{ fontSize: 9.5, color: tone, fontWeight: 600, letterSpacing: '0.08em' }}>
                    {ind.is_imputed ? 'IMPUTED' : `${ind.normalized_score}/100`}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 2, letterSpacing: '0.06em' }}>{ind.raw_unit}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 70 }}>
                <div className="mono tnum" style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>
                  {ind.raw_value !== null ? ind.raw_value.toFixed(2) : '—'}
                </div>
                <div className="mono" style={{ fontSize: 9, color: tempVar(ind.normalized_score), marginTop: 2, letterSpacing: '0.04em' }}>
                  SCORE {ind.normalized_score}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}>
          DETAILS
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function ScreenMethodology({ data, palette, onCyclePalette, onNavigate, focusCategory, onOpenTweaks }: Props) {
  const cats = mergeWithLive(data?.categories);
  const compositeScore = data?.composite_score ?? 0;
  const activeCats = cats.filter((c) => c.weight > 0);

  function handleOpenDetail(id: string) {
    onNavigate(`methodology-detail:${id}`);
  }
  const focusRef = useRef<boolean>(false);

  useEffect(() => {
    if (!focusCategory || focusRef.current) return;
    focusRef.current = true;
    const el = document.getElementById(`method-${focusCategory}`);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  }, [focusCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="methodology" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ maxWidth: 760 }}>
            <div className="bi-eyebrow">METHODOLOGY</div>
            <div style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              The composite score — broken into its {activeCats.length} ingredients.
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.55, textWrap: 'pretty' } as React.CSSProperties}>
              Every raw input is normalized to a 0–100 percentile against a 20-year rolling window.
              A reading of <span className="mono" style={{ color: 'var(--ink-1)' }}>70</span> means "more extreme than 70% of historical days."
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <div style={{ padding: '8px 14px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)' }}>
              <div className="bi-eyebrow" style={{ fontSize: 9 }}>ACTIVE</div>
              <div className="mono tnum" style={{ fontSize: 18, color: 'var(--ink-1)', marginTop: 2 }}>{activeCats.length} <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>/ {cats.length}</span></div>
            </div>
            <div style={{ padding: '8px 14px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)' }}>
              <div className="bi-eyebrow" style={{ fontSize: 9 }}>COMPOSITE</div>
              <div className="mono tnum" style={{ fontSize: 18, color: 'var(--ink-1)', marginTop: 2 }}>{compositeScore}</div>
            </div>
            <div style={{ padding: '8px 14px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)' }}>
              <div className="bi-eyebrow" style={{ fontSize: 9 }}>AS OF</div>
              <div className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-1)', marginTop: 4 }}>{data?.snapshot_date ?? '—'}</div>
            </div>
          </div>
        </div>

        {/* Weight bar */}
        <div className="bi-card bi-card-tight">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="bi-card-title">COMPOSITE WEIGHT MIX</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em' }}>{activeCats.length} ACTIVE CATEGORIES · 100% OF SCORE</div>
          </div>
          <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
            {activeCats.map((c) => (
              <div
                key={c.id}
                title={`${c.display_name} — ${Math.round(c.weight * 100)}%`}
                onClick={() => onNavigate(`methodology-detail:${c.id}`)}
                style={{
                  width: `${c.weight * 100}%`,
                  background: c.score !== null ? tempVar(c.score) : 'var(--ink-4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg)', fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700,
                  letterSpacing: '0.06em', cursor: 'pointer',
                }}
              >
                {c.display_name.toUpperCase()} · {Math.round(c.weight * 100)}%
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap-grid)', paddingBottom: 32 }}>
          {cats.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              compositeScore={compositeScore}
              focused={focusCategory === cat.id}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
