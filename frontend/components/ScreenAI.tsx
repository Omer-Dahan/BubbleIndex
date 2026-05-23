'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Topbar from './Topbar';
import { Radar, VerdictPill } from './Primitives';
import { riskTier } from '@/lib/utils';
import type { RiskScoreResponse, CategoryScore, Palette } from '@/lib/types';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
  onOpenTweaks?: () => void;
}

// Per-category insight text keyed by risk tier
const CAT_TEXTS: Record<string, Record<string, string>> = {
  valuation: {
    BUBBLE:   'CAPE ratio at extreme 98th-percentile levels — last reading this elevated was Feb 2000.',
    HIGH:     'CAPE elevated — above the 50-year mean. Historically reverts within 4y in 92% of cases.',
    ELEVATED: 'Valuations stretched but below historical extremes. Monitor earnings growth.',
    MODERATE: 'Valuation metrics within normal historical range. No immediate concern.',
    LOW:      'Market appears undervalued relative to historical earnings. Potential upside.',
  },
  macro_stress: {
    BUBBLE:   'Yield curve deeply inverted. Recession probability elevated. Fed in late-cycle tightening.',
    HIGH:     'Macro stress rising — yield curve compression and PMI softening signal caution.',
    ELEVATED: 'Macro indicators mixed — some softening in leading indicators worth watching.',
    MODERATE: 'Macro backdrop relatively stable. No immediate recessionary signals.',
    LOW:      'Strong macro backdrop. Yield curve normal, PMI expansionary across sectors.',
  },
  leverage_credit: {
    BUBBLE:   'Leverage at cycle peak — margin debt and corporate debt both at extremes.',
    HIGH:     'Fed balance sheet contracting, but M2 still above pre-pandemic trend.',
    ELEVATED: 'Credit spreads tightening. Corporate leverage elevated but stable.',
    MODERATE: 'Leverage metrics within historical norms. No systemic risk signal.',
    LOW:      'Balance sheets healthy. Credit spreads historically low.',
  },
  sentiment: {
    BUBBLE:   'Extreme euphoria — AAII bulls at 98th percentile. Retail inflows surging.',
    HIGH:     'AAII bullish reading elevated. Margin debt rising year-over-year.',
    ELEVATED: 'Sentiment moderately optimistic. Retail participation above average.',
    MODERATE: 'Sentiment balanced — neither extreme fear nor greed.',
    LOW:      'Sentiment fearful. Contrarian signal — historically precedes market recoveries.',
  },
  concentration: {
    BUBBLE:   'Top-10 names = 38% of S&P cap. Equivalent to peak 2000 concentration.',
    HIGH:     'Concentration risk elevated — mega-cap dominance at historical highs.',
    ELEVATED: 'Index concentration above average. Sector diversification limited.',
    MODERATE: 'Concentration within historical norms.',
    LOW:      'Broad market participation. Index well-diversified across sectors.',
  },
};

function categoryToInsight(cat: CategoryScore) {
  const tier = riskTier(cat.score);
  const texts = CAT_TEXTS[cat.id] ?? {};
  return {
    tag:        cat.display_name.toUpperCase(),
    verb:       tier.verb,
    tone:       tier.tone,
    categoryId: cat.id,
    text:       texts[tier.tier] ?? `${cat.display_name} score: ${Math.round(cat.score)}/100.`,
  };
}

// Static fallback insights when no backend data is available
const FALLBACK_INSIGHTS = [
  { tag: 'CONCENTRATION', verb: 'SELL',    tone: 'var(--t-9)', categoryId: 'concentration',   text: 'Top-10 names = 38% of S&P cap. Last reading this high was Feb 2000.' },
  { tag: 'VALUATION',     verb: 'CAUTION', tone: 'var(--t-7)', categoryId: 'valuation',       text: 'CAPE at elevated levels — above the 50-year mean. Reverts within 4y in 92% of cases.' },
  { tag: 'LEVERAGE',      verb: 'HOLD',    tone: 'var(--t-4)', categoryId: 'leverage_credit', text: 'Fed balance sheet contracting, but M2 still above pre-pandemic trend.' },
  { tag: 'SENTIMENT',     verb: 'WATCH',   tone: 'var(--t-5)', categoryId: 'sentiment',       text: 'AAII bullish reading elevated. Margin debt rising year-over-year.' },
];

const feedContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const feedItem = {
  hidden: { opacity: 0, x: -18 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 28 } },
};

export default function ScreenAI({ data, palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
  const score = data?.composite_score ?? 72;
  const tier = riskTier(score);
  const cats = data?.categories ?? [];

  const radarVals = cats.length >= 5
    ? cats.map(c => c.score / 100)
    : [0.78, 0.62, 0.42, 0.71, 0.51];
  const axes = cats.length >= 5
    ? cats.map(c => c.display_name.slice(0, 4).toUpperCase())
    : ['VAL', 'MAC', 'LEV', 'SEN', 'CON'];

  // Sort categories by score descending and build dynamic insights
  const insights = useMemo(() => {
    if (!cats.length) return FALLBACK_INSIGHTS;
    return [...cats]
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(categoryToInsight);
  }, [cats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="ai" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 'var(--gap-grid)', minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT — headline + feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 26 }}
          >
            <div className="bi-eyebrow">AI INSIGHTS · {new Date().toDateString().toUpperCase()}</div>
            <div style={{ fontSize: 34, fontWeight: 300, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.15, color: 'var(--ink-1)' }}>
              The market shows
              <span style={{ color: tier.tone, fontWeight: 500 }}> {tier.tier.toLowerCase()} </span>
              risk across multiple dimensions.
            </div>
          </motion.div>

          <motion.div
            variants={feedContainer}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflow: 'auto' }}
          >
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                variants={feedItem}
                className="bi-card bi-hoverable"
                onClick={() => onNavigate(`methodology:${ins.categoryId}`)}
                style={{ display: 'grid', gridTemplateColumns: '130px 1fr 90px', gap: 18, alignItems: 'center', cursor: 'pointer' }}
              >
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.10em' }}>{ins.tag}</div>
                <div style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.5 }}>{ins.text}</div>
                <div className="mono" style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 600, color: ins.tone, textAlign: 'right' }}>{ins.verb}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — radar + verdict */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>
          <motion.div
            className="bi-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 26, delay: 0.15 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>RISK FOOTPRINT</div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>VS 50Y AVG</span>
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <Radar axes={axes} values={radarVals} size={280} />
            </div>
          </motion.div>

          <motion.div
            className="bi-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 26, delay: 0.25 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>VERDICT</div>
              <VerdictPill score={score} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div className="bi-bignum" style={{ fontSize: 64, color: 'var(--ink-1)' }}>{score}</div>
              <div>
                <div className="mono" style={{ fontSize: 12, color: tier.tone, fontWeight: 600, letterSpacing: '0.12em' }}>{tier.tier}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em', marginTop: 3 }}>COMPOSITE SCORE</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 8 }}>
              <div className="bi-eyebrow" style={{ marginBottom: 6 }}>RECOMMENDED ACTION</div>
              <div style={{ fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.5 }}>
                {tier.tier === 'BUBBLE' || tier.tier === 'HIGH'
                  ? 'Trim concentrated growth exposure. Rotate 15–20% into short-duration sovereign.'
                  : tier.tier === 'ELEVATED'
                    ? 'Monitor risk indicators closely. Maintain defensive positioning.'
                    : 'Conditions are within historical norms. No immediate action required.'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
