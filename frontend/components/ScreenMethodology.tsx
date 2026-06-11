'use client';
import Link from 'next/link';
import Topbar from './Topbar';
import { tempVar } from '@/lib/utils';
import { STATIC_CATEGORIES } from '@/lib/methodology-data';
import type { RiskScoreResponse, CategoryScore, Palette } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { useIsMobile, useIsTablet } from '@/lib/useBreakpoint';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

function mergeWithLive(cats: CategoryScore[] | undefined, staticCats: typeof STATIC_CATEGORIES) {
  return staticCats.map((s) => {
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
}: {
  cat: ReturnType<typeof mergeWithLive>[number];
  compositeScore: number;
}) {
  const { t, isRtl } = useLanguage();
  const tone = cat.score !== null ? tempVar(cat.score) : 'var(--ink-3)';
  const weightPct = Math.round(cat.weight * 100);
  const contribution = cat.score !== null ? (cat.score * weightPct / 100).toFixed(1) : '—';

  return (
    <Link
      href={`/methodology/${cat.id}`}
      id={`method-${cat.id}`}
      className="bi-card bi-hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        paddingLeft: isRtl ? undefined : 'calc(var(--pad-card) + 4px)',
        paddingRight: isRtl ? 'calc(var(--pad-card) + 4px)' : undefined,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute',
        left: isRtl ? undefined : 0,
        right: isRtl ? 0 : undefined,
        top: 14,
        bottom: 14,
        width: 3,
        background: tone,
        opacity: 0.85,
        borderRadius: 2
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ fontSize: 19, fontWeight: 500, color: 'var(--ink-1)', letterSpacing: '-0.01em', margin: 0 }}>{cat.display_name}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 10, padding: '12px 0', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}>
        <div>
          <div className="bi-eyebrow" style={{ fontSize: 9 }}>{t('common.weight')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <div className="mono tnum" style={{ fontSize: 26, fontWeight: 300, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>{weightPct}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>%</div>
          </div>
        </div>
        <div>
          <div className="bi-eyebrow" style={{ fontSize: 9 }}>{t('common.score')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <div className="mono tnum" style={{ fontSize: 26, fontWeight: 500, color: tone, letterSpacing: '-0.02em' }}>
              {cat.score !== null ? cat.score : '—'}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>/ 100</div>
          </div>
        </div>
        <div>
          <div className="bi-eyebrow" style={{ fontSize: 9 }}>{t('common.contribution')}</div>
          <div className="mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>
            {cat.score !== null
              ? <>{contribution}<span style={{ color: 'var(--ink-4)' }}> {t('common.pointsOfScore', { score: compositeScore })}</span></>
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
          <div className="bi-eyebrow" style={{ fontSize: 9 }}>{t('common.liveInputs')}</div>
          {cat.indicators.map((ind) => (
            <div key={ind.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'baseline', padding: '6px 0', borderTop: '1px solid var(--hairline)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-1)', fontWeight: 500 }}>{ind.display_name}</div>
                  <div className="mono" style={{ fontSize: 9.5, color: tone, fontWeight: 600, letterSpacing: '0.08em' }}>
                    {ind.is_imputed ? t('common.imputed') : `${ind.normalized_score}/100`}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 2, letterSpacing: '0.06em' }}>{ind.raw_unit}</div>
              </div>
              <div style={{ textAlign: isRtl ? 'left' : 'right', minWidth: 70 }}>
                <div className="mono tnum" style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>
                  {ind.raw_value !== null ? ind.raw_value.toFixed(2) : '—'}
                </div>
                <div className="mono" style={{ fontSize: 9, color: tempVar(ind.normalized_score), marginTop: 2, letterSpacing: '0.04em' }}>
                  {t('common.score')} {ind.normalized_score}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}>
          {t('common.details')}
          {isRtl ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ScreenMethodology({ data, palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const staticCats = (t('methodology.categories') || []) as typeof STATIC_CATEGORIES;
  const cats = mergeWithLive(data?.categories, staticCats);
  const compositeScore = data?.composite_score ?? 0;
  const activeCats = cats.filter((c) => c.weight > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>

        <div className="methodology-header" style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexDirection: isRtl ? 'row-reverse' : 'row',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ flex: '1 1 300px', maxWidth: 760 }}>
            <div className="bi-eyebrow">{t('methodology.eyebrow')}</div>
            <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, textWrap: 'balance' } as React.CSSProperties}>
              {t('methodology.title', { count: activeCats.length })}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.55, textWrap: 'pretty' } as React.CSSProperties}>
              {t('methodology.desc', { seventy: '70' })}
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexShrink: 0,
            justifyContent: isRtl ? 'flex-end' : 'flex-start',
            flexWrap: 'wrap',
            flexDirection: isRtl ? 'row-reverse' : 'row'
          }}>
            <div style={{ padding: '8px 14px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)' }}>
              <div className="bi-eyebrow" style={{ fontSize: 9 }}>{t('methodology.active')}</div>
              <div className="mono tnum" style={{ fontSize: 18, color: 'var(--ink-1)', marginTop: 2 }}>{activeCats.length} <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>/ {cats.length}</span></div>
            </div>
            <div style={{ padding: '8px 14px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)' }}>
              <div className="bi-eyebrow" style={{ fontSize: 9 }}>{t('methodology.composite')}</div>
              <div className="mono tnum" style={{ fontSize: 18, color: 'var(--ink-1)', marginTop: 2 }}>{compositeScore}</div>
            </div>
            <div style={{ padding: '8px 14px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)' }}>
              <div className="bi-eyebrow" style={{ fontSize: 9 }}>{t('methodology.asOf')}</div>
              <div className="mono tnum" style={{ fontSize: 11, color: 'var(--ink-1)', marginTop: 4 }}>{data?.snapshot_date ?? '—'}</div>
            </div>
          </div>
        </div>

        {/* Weight bar */}
        <div className="bi-card bi-card-tight">
          <div className="weight-mix-header" style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexDirection: isRtl ? 'row-reverse' : 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 10
          }}>
            <div className="bi-card-title" style={{ margin: 0 }}>{t('methodology.weightMix')}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em' }}>{t('methodology.activeMixLabel', { count: activeCats.length })}</div>
          </div>
          <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
            {activeCats.map((c) => (
              <Link
                key={c.id}
                href={`/methodology/${c.id}`}
                title={`${c.display_name} (${Math.round(c.weight * 100)}%)`}
                style={{
                  width: `${c.weight * 100}%`,
                  background: c.score !== null ? tempVar(c.score) : 'var(--ink-4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg)', fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700,
                  letterSpacing: '0.06em', cursor: 'pointer', textDecoration: 'none',
                }}
              >
                <span className="weight-bar-text">{c.display_name.toUpperCase()} · {Math.round(c.weight * 100)}%</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="methodology-grid" style={{ gap: 'var(--gap-grid)', paddingBottom: 32 }}>
          {cats.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              compositeScore={compositeScore}
            />
          ))}
        </div>
      </div>
      <style jsx global>{`
        .methodology-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1024px) {
          .methodology-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 767px) {
          .methodology-grid {
            grid-template-columns: 1fr;
          }
          .weight-bar-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

