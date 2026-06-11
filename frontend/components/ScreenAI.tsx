'use client';
import { useMemo } from 'react';
import { useIsMobile } from '@/lib/useBreakpoint';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Topbar from './Topbar';
import { Radar, VerdictPill } from './Primitives';
import { riskTier } from '@/lib/utils';
import type { RiskScoreResponse, CategoryScore, Palette } from '@/lib/types';

import { useLanguage } from '@/lib/LanguageContext';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

export default function ScreenAI({ data, palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const score = data?.composite_score ?? 72;
  const tier = riskTier(score);
  const cats = data?.categories ?? [];

  const ABBR: Record<string, string> = isRtl ? {
    valuation: 'תמח',
    macro_stress: 'מאק',
    leverage_credit: 'מינ',
    sentiment: 'סנט',
    concentration: 'ריכ',
  } : {
    valuation: 'VAL',
    macro_stress: 'MAC',
    leverage_credit: 'LEV',
    sentiment: 'SEN',
    concentration: 'CON',
  };

  const radarVals = cats.length >= 5
    ? cats.map(c => c.score / 100)
    : [0.78, 0.62, 0.42, 0.71, 0.51];
  const axes = cats.length >= 5
    ? cats.map(c => ABBR[c.id] || c.display_name.slice(0, 4).toUpperCase())
    : isRtl
      ? ['תמח', 'מאק', 'מינ', 'סנט', 'ריכ']
      : ['VAL', 'MAC', 'LEV', 'SEN', 'CON'];

  // Sort categories by score descending and build dynamic insights
  const insights = useMemo(() => {
    if (!cats.length) {
      const fallbackCategoryIds = ['concentration', 'valuation', 'leverage_credit', 'sentiment'];
      const scoreMap: Record<string, number> = { concentration: 88, valuation: 76, leverage_credit: 52, sentiment: 58 };
      
      return fallbackCategoryIds.map(id => {
        const fallScore = scoreMap[id];
        const fallTier = riskTier(fallScore);
        const tierKey = fallTier.tier.toLowerCase();
        
        return {
          tag: (t(`indicators.rowLabels.${id}.name`) || id).toUpperCase(),
          verb: t(`riskTiers.${tierKey}.verb`),
          tone: fallTier.tone,
          categoryId: id,
          text: t(`ai.insightsText.${id}.${fallTier.tier}`),
        };
      });
    }

    return [...cats]
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(cat => {
        const catTier = riskTier(cat.score);
        const tierKey = catTier.tier.toLowerCase();
        
        const localizedTagName = (t(`indicators.rowLabels.${cat.id}.name`) || cat.display_name).toUpperCase();
        const localizedVerb = t(`riskTiers.${tierKey}.verb`);
        const localizedText = t(`ai.insightsText.${cat.id}.${catTier.tier}`) !== `ai.insightsText.${cat.id}.${catTier.tier}`
          ? t(`ai.insightsText.${cat.id}.${catTier.tier}`)
          : `${cat.display_name} score: ${Math.round(cat.score)}/100.`;
        
        return {
          tag: localizedTagName,
          verb: localizedVerb,
          tone: catTier.tone,
          categoryId: cat.id,
          text: localizedText,
        };
      });
  }, [cats, t]);

  const formattedDate = new Date().toLocaleDateString(isRtl ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  const localizedTierName = t(`riskTiers.${tier.tier.toLowerCase()}.tier`);

  const feedContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };
  const feedItem = {
    hidden: { opacity: 0, x: isRtl ? 18 : -18 },
    show:   { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 28 } },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 420px', gap: 'var(--gap-grid)', minHeight: 0, overflow: isMobile ? 'visible' : 'hidden' }}>

        {/* LEFT — headline + feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 26 }}
          >
            <div className="bi-eyebrow">{t('ai.title', { date: formattedDate })}</div>
            <h1 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 300, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.15, color: 'var(--ink-1)' }}>
              {(() => {
                const headlineTemplate = t('ai.headline', { tier: '___TIER___' });
                const parts = headlineTemplate.split('___TIER___');
                return (
                  <>
                    {parts[0]}
                    <span style={{ color: tier.tone, fontWeight: 500 }}>
                      {isRtl ? ` ${localizedTierName} ` : ` ${localizedTierName.toLowerCase()} `}
                    </span>
                    {parts[1]}
                  </>
                );
              })()}
            </h1>
          </motion.div>

          <motion.div
            variants={feedContainer}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflow: 'auto' }}
          >
            {insights.map((ins, i) => (
              <Link key={i} href={`/methodology#method-${ins.categoryId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <motion.div
                  variants={feedItem}
                  className="bi-card bi-hoverable"
                  style={isMobile ? {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    cursor: 'pointer'
                  } : {
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr 90px',
                    gap: 18,
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isMobile ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.10em' }}>{ins.tag}</div>
                        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 600, color: ins.tone }}>{ins.verb}</div>
                      </div>
                      <div style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.5, textAlign: isRtl ? 'right' : 'left' }}>{ins.text}</div>
                    </>
                  ) : (
                    <>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.10em' }}>{ins.tag}</div>
                      <div style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.5 }}>{ins.text}</div>
                      <div className="mono" style={{ fontSize: 12, letterSpacing: '0.12em', fontWeight: 600, color: ins.tone, textAlign: isRtl ? 'left' : 'right' }}>{ins.verb}</div>
                    </>
                  )}
                </motion.div>
              </Link>
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
              <h2 className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', margin: 0 }}>{t('ai.riskFootprint')}</h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>{t('ai.vsAvg')}</span>
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <Radar axes={axes} values={radarVals} size={isMobile ? 220 : 280} />
            </div>
          </motion.div>

          <motion.div
            className="bi-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 26, delay: 0.25 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', margin: 0 }}>{t('common.verdict')}</h2>
              <VerdictPill score={score} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div className="bi-bignum" style={{ fontSize: 64, color: 'var(--ink-1)' }}>{score}</div>
              <div>
                <div className="mono" style={{ fontSize: 12, color: tier.tone, fontWeight: 600, letterSpacing: '0.12em' }}>{localizedTierName}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em', marginTop: 3 }}>{t('ai.compositeScore')}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 8 }}>
              <div className="bi-eyebrow" style={{ marginBottom: 6 }}>{t('ai.recommendedAction')}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.5 }}>
                {tier.tier === 'BUBBLE' || tier.tier === 'HIGH'
                  ? t('ai.recommendations.bubbleHigh')
                  : tier.tier === 'ELEVATED'
                    ? t('ai.recommendations.elevated')
                    : t('ai.recommendations.normal')}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

