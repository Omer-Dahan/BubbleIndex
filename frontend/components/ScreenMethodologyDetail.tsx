'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Topbar from './Topbar';
import Breadcrumbs from './Breadcrumbs';
import { DETAILS, LEVEL_COLORS } from '@/lib/methodology-data';
import type { Palette } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { useIsMobile } from '@/lib/useBreakpoint';


const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 220, damping: 28 } },
};

interface Props {
  category: string;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

export default function ScreenMethodologyDetail({ category, palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const localizedDetails = t('methodology.details') as any;
  const detail = localizedDetails?.[category];

  if (!detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
        <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <div className="mono" style={{ color: 'var(--ink-4)', fontSize: 12, letterSpacing: '0.1em' }}>{t('methodology.unknownCategory')}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80, direction: isRtl ? 'rtl' : 'ltr' }}>

      {/* Sticky Topbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      </div>

      {/* Floating back button */}
      <Link
        href="/methodology"
        style={{
          position: 'fixed', bottom: 28,
          left: isRtl ? undefined : 28,
          right: isRtl ? 28 : undefined,
          zIndex: 9980,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 40,
          background: 'var(--panel)', border: '1px solid var(--hairline-2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
          color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.08em', cursor: 'pointer', textDecoration: 'none',
          transition: 'color 0.15s, background 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--ink-1)';
          e.currentTarget.style.background = 'var(--panel-2)';
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.55)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--ink-2)';
          e.currentTarget.style.background = 'var(--panel)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.45)';
        }}
      >
        {isRtl ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        )}
        {t('topbar.nav.methodology')}
      </Link>

      <div style={{ flex: 1, padding: 'var(--pad-screen)', maxWidth: 960, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>

        <Breadcrumbs items={[
          { label: t('topbar.nav.home'), href: '/' },
          { label: t('topbar.nav.methodology'), href: '/methodology' },
          { label: detail.display_name },
        ]} />

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut', delay: 0.05 }}
          className="bi-card"
          style={{
            position: 'relative',
            paddingLeft: isRtl ? undefined : 'calc(var(--pad-card) + 6px)',
            paddingRight: isRtl ? 'calc(var(--pad-card) + 6px)' : undefined,
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            left: isRtl ? undefined : 0,
            right: isRtl ? 0 : undefined,
            top: 0,
            bottom: 0,
            width: 4,
            background: 'var(--t-6)',
            borderRadius: isRtl ? '0 2px 2px 0' : '2px 0 0 2px'
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="bi-eyebrow">{t('methodology.heroEyebrow')}</div>
              <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.025em', color: 'var(--ink-1)', margin: '8px 0 6px', fontFamily: 'var(--font-display)' }}>
                {detail.display_name}
              </h1>
              <div style={{ fontSize: 16, color: 'var(--ink-3)', lineHeight: 1.5, textWrap: 'pretty' } as React.CSSProperties}>
                {detail.tagline}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'flex-start' }}>
              <div style={{ padding: '10px 16px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)', textAlign: 'center' }}>
                <div className="bi-eyebrow" style={{ fontSize: 9 }}>{t('common.weight')}</div>
                <div className="mono tnum" style={{ fontSize: 28, fontWeight: 300, color: 'var(--ink-1)', marginTop: 4 }}>
                  {detail.weight}<span style={{ fontSize: 13, color: 'var(--ink-4)' }}>%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overview + Why */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--gap-grid)' }}
        >
          <motion.div variants={itemVariants} className="bi-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="bi-card-title">{t('methodology.whatWeMeasure')}</h2>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.65, textWrap: 'pretty' } as React.CSSProperties}>
              {detail.overview}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bi-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="bi-card-title">{t('methodology.whyMattersTitle')}</h2>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.65, textWrap: 'pretty' } as React.CSSProperties}>
              {detail.why_matters}
            </div>
            <div style={{
              marginTop: 4, padding: '10px 14px', borderRadius: 8, background: 'var(--panel-2)',
              borderLeft: isRtl ? undefined : '3px solid var(--t-5)',
              borderRight: isRtl ? '3px solid var(--t-5)' : undefined
            }}>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>{detail.mechanics}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div variants={itemVariants} initial="hidden" animate="show">
          <div className="bi-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 className="bi-card-title">{t('methodology.keyMetricsTitle')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {detail.metrics.map((metric: any, i: number) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: i > 0 ? 20 : 0, borderTop: i > 0 ? '1px solid var(--hairline)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-1)' }}>{metric.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.6 }}>{metric.description}</div>
                    <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-5)', marginTop: 6, letterSpacing: '0.05em' }}>{t('methodology.sourceLabel', { source: metric.source })}</div>
                  </div>

                  {/* Threshold bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {metric.thresholds.map((th: any, j: number) => (
                      <div key={j} style={{ display: 'grid', gridTemplateColumns: '28px 130px 1fr auto', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: LEVEL_COLORS[th.level] ?? 'var(--ink-4)', flexShrink: 0, justifySelf: 'center' }} />
                        <div style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500 }}>{th.label}</div>
                        <div style={{ height: 3, borderRadius: 2, background: `linear-gradient(${isRtl ? 'to left' : 'to right'}, ${LEVEL_COLORS[th.level] ?? 'var(--ink-4)'}, transparent)`, opacity: 0.5 }} />
                        <div className="mono tnum" style={{ fontSize: 11, color: LEVEL_COLORS[th.level] ?? 'var(--ink-4)', fontWeight: 600, whiteSpace: 'nowrap', textAlign: isRtl ? 'left' : 'right' }}>{th.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Historical Episodes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.18 }}
          className="bi-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <h2 className="bi-card-title">{t('methodology.historicalEpisodes')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {detail.episodes.map((ep: any, i: number) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 1fr',
                gap: 16, padding: '14px 0',
                borderTop: i > 0 ? '1px solid var(--hairline)' : 'none',
                alignItems: 'start',
              }}>
                <div>
                  <div className="mono tnum" style={{ fontSize: 11, color: 'var(--t-6)', fontWeight: 600, letterSpacing: '0.04em' }}>{ep.date}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-1)', fontWeight: 500, marginTop: 2, lineHeight: 1.3 }}>{ep.event}</div>
                </div>
                <div>
                  <div className="bi-eyebrow" style={{ fontSize: 8.5, marginBottom: 4 }}>{t('methodology.signalLabel')}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{ep.signal}</div>
                </div>
                <div>
                  <div className="bi-eyebrow" style={{ fontSize: 8.5, marginBottom: 4 }}>{t('methodology.outcomeLabel')}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{ep.outcome}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Score Interpretation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.22 }}
          className="bi-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <h2 className="bi-card-title">{t('methodology.interpretTitle')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
            {detail.interpretation.map((tier: any, i: number) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'var(--panel-2)',
                borderLeft: isRtl ? undefined : `3px solid ${LEVEL_COLORS[tier.level] ?? 'var(--ink-4)'}`,
                borderRight: isRtl ? `3px solid ${LEVEL_COLORS[tier.level] ?? 'var(--ink-4)'}` : undefined,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: LEVEL_COLORS[tier.level] ?? 'var(--ink-1)' }}>{tier.label}</div>
                  <div className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{tier.range}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55 }}>{tier.description}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sources */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.26 }}
          className="bi-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 32 }}
        >
          <h2 className="bi-card-title">{t('methodology.academicSources')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail.sources.map((src: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '6px 0', borderTop: i > 0 ? '1px solid var(--hairline)' : 'none' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', minWidth: 20, letterSpacing: '0.04em' }}>[{i + 1}]</div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>{src.author}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>: <em>{src.title}</em></span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-5)', marginInlineStart: 8 }}>{src.year}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}


