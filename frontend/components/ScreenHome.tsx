'use client';
import { useMemo } from 'react';
import { useIsMobile, useWindowSize } from '@/lib/useBreakpoint';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Gauge from './Gauge';
import { Sparkline, VerdictPill } from './Primitives';
import Topbar from './Topbar';
import { riskTier, tempVar, makeSeries } from '@/lib/utils';
import type { RiskScoreResponse, SnapshotSummary, GaugeKind, Palette } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

const CATEGORY_KEYS: (keyof SnapshotSummary)[] = [
  'valuation_score', 'macro_stress_score', 'leverage_credit_score', 'sentiment_score', 'concentration_score',
];

interface Props {
  data: RiskScoreResponse | null;
  snapshots: SnapshotSummary[];
  gaugeKind: GaugeKind;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 220, damping: 28 } },
};

export default function ScreenHome({ data, snapshots, gaugeKind, palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const { width: winWidth } = useWindowSize();
  const gaugeSize = isMobile ? Math.min(winWidth - 32, 300) : 360;
  const score = data?.composite_score ?? 72;
  const tier = riskTier(score);

  const activeTierKey = tier.tier.toLowerCase() as 'low' | 'moderate' | 'elevated' | 'high' | 'bubble';
  const localizedTierName = t(`riskTiers.${activeTierKey}.tier`);

  const sorted = useMemo(() =>
    [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
  [snapshots]);

  // Compute deltas from real monthly snapshots (1M / 3M / 1Y)
  const deltas = useMemo(() => {
    if (sorted.length < 2) return null;
    const last = sorted[sorted.length - 1].composite_score;
    const get = (n: number) =>
      sorted.length > n ? last - sorted[sorted.length - 1 - n].composite_score : null;
    return { '1M': get(1), '3M': get(3), '1Y': get(12) };
  }, [sorted]);

  const subscores = useMemo(() => {
    return (data?.categories ?? []).map((cat, i) => {
      const value = Math.round(cat.score);
      const median = [54, 49, 51, 50, 48][i] ?? 50;
      const keyMap: Record<string, keyof SnapshotSummary> = {
        valuation: 'valuation_score',
        macro_stress: 'macro_stress_score',
        leverage_credit: 'leverage_credit_score',
        sentiment: 'sentiment_score',
        concentration: 'concentration_score',
      };
      const key = keyMap[cat.id] || 'composite_score';
      let trend: number[];
      if (sorted.length >= 2) {
        trend = sorted.map(s => (s[key] as number) / 100);
      } else {
        const rawTrend = makeSeries(24, (i + 1) * 13, 0.07, value / 100);
        trend = [...rawTrend.slice(0, -1), value / 100];
      }
      const deltaMo = trend.length >= 2
        ? Math.round((trend[trend.length - 1] - trend[Math.max(0, trend.length - 2)]) * 100)
        : 0;
      return { ...cat, value, median, deltaMo, trend };
    });
  }, [data, sorted]);

  const closest = data?.crisis_similarities?.[0];
  const localizedAnalogName = closest
    ? t(`historical.crises.${closest.crisis_id}.name`) !== `historical.crises.${closest.crisis_id}.name`
      ? t(`historical.crises.${closest.crisis_id}.name`)
      : closest.display_name.split('·')[0]?.trim()
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{
        flex: 1, padding: 'var(--pad-screen)',
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '460px 1fr',
        gap: 'var(--gap-grid)', minHeight: 0, overflow: isMobile ? 'visible' : 'hidden',
      }}>

        {/* LEFT — gauge */}
        <motion.div
          initial={{ opacity: 0, x: isRtl ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}
        >
          <div className="bi-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <div className="bi-eyebrow">{t('home.marketRiskLive')}</div>
                <h1 style={{ fontSize: 18, fontWeight: 500, marginTop: 4, color: 'var(--ink-1)' }}>{t('home.compositeLabel')}</h1>
              </div>
              <VerdictPill score={score} />
            </div>
            <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
              <Gauge kind={gaugeKind} score={score} size={gaugeKind === 'bar' ? undefined : gaugeSize} />
            </div>
            {/* Real delta stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, marginTop: 14, background: 'var(--hairline)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' }}>
              {(['1M', '3M', '1Y'] as const).map((label) => {
                const val = deltas?.[label] ?? null;
                const displayLabel = label === '1M' ? t('common.oneMonth') : label === '3M' ? t('common.threeMonth') : t('common.oneYear');
                return (
                  <div key={label} style={{ padding: '12px 14px', background: 'var(--panel)', textAlign: 'center' }}>
                    <div className="bi-eyebrow">{displayLabel} Δ</div>
                    <div className="mono tnum" style={{
                      fontSize: 18, marginTop: 5,
                      color: val === null ? 'var(--ink-4)' : val >= 0 ? 'var(--t-8)' : 'var(--t-3)',
                    }}>
                      {val === null ? '—' : (val >= 0 ? '+' : '') + val.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>

          {/* AI Brief */}
          <motion.div
            className="bi-card"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 26, delay: 0.05 }}
            style={{ textAlign: isRtl ? 'right' : 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <h2 className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{t('home.aiMarketBrief')}</h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>
                {data?.snapshot_date ? t('home.asOf', { date: data.snapshot_date }) : t('common.loading')}
              </span>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-1)', margin: 0, fontWeight: 400 }}>
              {t('home.territoryLabel', { tier: localizedTierName })}
              {data?.categories?.[4]?.score && data.categories[4].score > 60
                ? t('home.concentrationAlert')
                : t('home.macroAlert')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
              {[
                [t('common.verdict'),        t(`riskTiers.${activeTierKey}.verb`),              tier.tone],
                [t('common.closestAnalog'), localizedAnalogName,                              'var(--ink-1)'],
                [t('common.similarity'),     closest ? `${closest.similarity_score}%` : '—',         'var(--ink-1)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ padding: '10px 12px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)', textAlign: isRtl ? 'right' : 'left' }}>
                  <div className="bi-eyebrow">{label}</div>
                  <div className="mono" style={{ fontSize: 13, marginTop: 5, color, fontWeight: 600, letterSpacing: '0.06em' }}>{val}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Risk breakdown */}
          <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <h2 className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{t('home.riskBreakdown', { count: subscores.length })}</h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>{t('home.vsMedianTrend')}</span>
            </div>
            <motion.div
              variants={cardContainer}
              initial="hidden"
              animate="show"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10, flex: '1 1 0' }}>
                {subscores.slice(0, 3).map((s) => (
                  <motion.div key={s.id} variants={cardItem}>
                    <RiskCard s={s} />
                  </motion.div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, flex: '1 1 0' }}>
                {subscores.slice(3).map((s) => (
                  <motion.div key={s.id} variants={cardItem}>
                    <RiskCard s={s} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SubscoreItem = { id: string; display_name: string; weight: number; value: number; median: number; deltaMo: number; trend: number[] };

function RiskCard({ s }: { s: SubscoreItem }) {
  const { t, isRtl } = useLanguage();
  const tone = tempVar(s.value);
  const above = s.value > s.median;

  const categoryTranslations = t('methodology.categories');
  const catTranslation = Array.isArray(categoryTranslations) ? categoryTranslations.find((c: any) => c.id === s.id) : null;
  const localizedName = catTranslation ? catTranslation.display_name : s.display_name;

  return (
    <Link href={`/methodology#method-${s.id}`} className="bi-hoverable" style={{ padding: '14px 16px', border: '1px solid var(--hairline)', borderRadius: 10, background: 'var(--panel-2)', display: 'flex', flexDirection: 'column', gap: 8, height: '100%', cursor: 'pointer', boxSizing: 'border-box', direction: isRtl ? 'rtl' : 'ltr', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
          <h3 style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500, margin: 0 }}>{localizedName}</h3>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3, letterSpacing: '0.04em' }}>
            {t('home.weightLabel', { weight: (s.weight * 100).toFixed(0) })}
          </div>
        </div>
        <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
          <div className="mono tnum" style={{ fontSize: 22, lineHeight: 1, color: tone, fontWeight: 500, letterSpacing: '-0.02em' }}>{s.value}</div>
          <div className="mono tnum" style={{ fontSize: 11, marginTop: 4, color: above ? 'var(--t-8)' : 'var(--t-3)', fontWeight: 600, letterSpacing: '0.04em' }}>
            {above ? '▲' : '▼'} {t('home.vsMedLabel', { diff: Math.abs(s.value - s.median) })}
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'var(--panel-3)', borderRadius: 3, marginTop: 18 }}>
        <div style={{ width: `${s.value}%`, height: '100%', background: tone, borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: `${s.median}%`, top: -4, bottom: -4, width: 2, background: 'var(--ink-2)', borderRadius: 1 }} />
        <div style={{
          position: 'absolute', left: `${s.median}%`, bottom: 10, transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-2)',
          background: 'var(--panel-3)', border: '1px solid var(--hairline-2)',
          borderRadius: 3, padding: '1px 4px', letterSpacing: '0.06em', whiteSpace: 'nowrap',
        }}>{t('common.med')}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div style={{ flex: 1, minWidth: 0, clipPath: `inset(0 ${100 - s.value}% 0 0)` }}>
          <Sparkline data={s.trend} h={28} stroke={tone} fill fluid yMin={0} yMax={1} />
        </div>
        <div style={{ textAlign: isRtl ? 'left' : 'right', flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>{t('common.oneMonth')}</div>
          <div className="mono tnum" style={{ fontSize: 14, color: s.deltaMo >= 0 ? 'var(--t-8)' : 'var(--t-3)', fontWeight: 600 }}>
            {s.deltaMo >= 0 ? '+' : ''}{s.deltaMo}
          </div>
        </div>
      </div>
    </Link>
  );
}
