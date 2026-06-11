'use client';
import { useMemo, useState, useEffect } from 'react';
import { useIsMobile } from '@/lib/useBreakpoint';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from './Topbar';
import { tempVar } from '@/lib/utils';
import { riskTier } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import type { RiskScoreResponse, SnapshotSummary, Palette } from '@/lib/types';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const, delay: i * 0.07 } }),
};

const fadeRight = {
  hidden: { opacity: 0, x: 24 },
  visible: (i = 0) => ({ opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as const, delay: i * 0.09 } }),
};

interface Props {
  data: RiskScoreResponse | null;
  snapshots: SnapshotSummary[];
  palette: Palette;
  onCyclePalette: () => void;
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

export default function ScreenHistorical({ data, snapshots, palette, onCyclePalette, onOpenTweaks }: Props) {
  const { t, isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const [activeRange, setActiveRange] = useState<TimeRange>('All');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [activeCrisisInfo, setActiveCrisisInfo] = useState<any | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const similarities = data?.crisis_similarities ?? [];
  const topSimilar = similarities[0];

  const localizedMonths = isRtl
    ? ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ']
    : MONTH_NAMES;

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

  const getLocalizedCrisisName = (era: any) => {
    if (!era) return '—';
    const translatedName = t(`historical.crises.${era.crisis_id}.name`);
    return translatedName !== `historical.crises.${era.crisis_id}.name`
      ? translatedName
      : era.display_name;
  };

  const topSimilarName = topSimilar ? getLocalizedCrisisName(topSimilar) : '';

  // Set the selected date needle to the closest matching snapshot for a crisis era
  const handleSelectEra = (era: any) => {
    if (!era.peak_date) return;

    // Switch range to 'All' so that any historical year is visible on the chart
    setActiveRange('All');

    const targetYear = era.peak_date.slice(0, 4);
    const targetMonth = era.peak_date.slice(5, 7);

    // Try finding a snapshot in the exact month first
    let matched = snapshots.find(s => s.snapshot_date.startsWith(`${targetYear}-${targetMonth}`));

    // Fall back to the absolute closest snapshot in time if no month-level snapshot match
    if (!matched && snapshots.length > 0) {
      const targetTime = new Date(era.peak_date).getTime();
      let minDiff = Infinity;
      for (const s of snapshots) {
        const diff = Math.abs(new Date(s.snapshot_date).getTime() - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          matched = s;
        }
      }
    }

    if (matched) {
      const yearStr = matched.snapshot_date.slice(0, 4);
      setSelectedYear(yearStr);
      setSelectedDate(matched.snapshot_date);
    }
  };

  // Close the crisis explanation modal when the Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCrisisInfo(null);
      }
    };
    if (activeCrisisInfo) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeCrisisInfo]);

  const filtered = useMemo(() => filterByRange(snapshots, activeRange), [snapshots, activeRange]);

  const years = useMemo(() => {
    const set = new Set(snapshots.map(s => s.snapshot_date.slice(0, 4)));
    return Array.from(set).sort().reverse();
  }, [snapshots]);

  // One slot per calendar month (Jan-Dec); keep the latest snapshot when a month has several
  // (e.g. the current month gets daily updates), and leave months without data as null
  const monthsForYear = useMemo(() => {
    const byMonth = new Map<number, SnapshotSummary>();
    for (const s of snapshots) {
      if (!s.snapshot_date.startsWith(selectedYear)) continue;
      const month = parseInt(s.snapshot_date.slice(5, 7), 10) - 1;
      const existing = byMonth.get(month);
      if (!existing || s.snapshot_date > existing.snapshot_date) byMonth.set(month, s);
    }
    return Array.from({ length: 12 }, (_, month) => byMonth.get(month) ?? null);
  }, [snapshots, selectedYear]);

  const yearIndex = years.indexOf(selectedYear);
  const goToYear = (idx: number) => {
    if (idx < 0 || idx >= years.length) return;
    setSelectedYear(years[idx]);
    setSelectedDate(null);
  };

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

  const handleChartInteraction = (clientX: number, currentTarget: SVGSVGElement) => {
    if (filtered.length < 2) return null;
    const rect = currentTarget.getBoundingClientRect();
    const clickX = ((clientX - rect.left) / rect.width) * 800; // SVG viewBox width is 800
    
    const xMin = 40;
    const xMax = 790;
    const span = xMax - xMin; // 750
    
    const clampedX = Math.max(xMin, Math.min(xMax, clickX));
    const pct = (clampedX - xMin) / span;
    const approxIdx = pct * (filtered.length - 1);
    const nearestIdx = Math.round(approxIdx);
    return filtered[nearestIdx] ?? null;
  };

  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const matched = handleChartInteraction(e.clientX, e.currentTarget);
    if (matched) {
      const yearStr = matched.snapshot_date.slice(0, 4);
      setSelectedYear(yearStr);
      setSelectedDate(matched.snapshot_date);
    }
  };

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const matched = handleChartInteraction(e.clientX, e.currentTarget);
    if (matched) {
      setHoveredDate(matched.snapshot_date);
    }
  };

  const handleChartMouseLeave = () => {
    setHoveredDate(null);
  };

  const handleChartTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches[0]) {
      const matched = handleChartInteraction(e.touches[0].clientX, e.currentTarget);
      if (matched) {
        const yearStr = matched.snapshot_date.slice(0, 4);
        setSelectedYear(yearStr);
        setSelectedDate(matched.snapshot_date);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />
      <div className="historical-grid" style={{ flex: 1, padding: 'var(--pad-screen)', display: 'grid', gap: 'var(--gap-grid)', minHeight: 0 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
          <motion.div
            variants={fadeUp} custom={0} initial="hidden" animate="visible"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexDirection: isRtl ? 'row-reverse' : 'row',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            <div style={{ flex: '1 1 300px', textAlign: isRtl ? 'right' : 'left' }}>
              <div className="bi-eyebrow">{t('historical.title')}</div>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--ink-1)' }}>
                {topSimilar
                  ? t('historical.subtitleWithAnalog', { analog: topSimilarName })
                  : t('historical.subtitleDefault')}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>
                {filtered.length > 0
                  ? t('historical.dataStats', { count: filtered.length, start: filtered[0]?.snapshot_date, end: filtered[filtered.length - 1]?.snapshot_date })
                  : t('historical.noData')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: isRtl ? 'flex-end' : 'flex-start', flexWrap: 'wrap' }}>
              {TIME_RANGES.map((l, i) => (
                <motion.button
                  key={l}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  onClick={() => setActiveRange(l)}
                  style={{
                    padding: '7px 14px', border: '1px solid var(--hairline)', borderRadius: 6,
                    fontSize: 12, color: activeRange === l ? 'var(--ink-1)' : 'var(--ink-3)',
                    fontFamily: 'var(--font-mono)', background: activeRange === l ? 'var(--panel-3)' : 'var(--panel)',
                    cursor: 'pointer', letterSpacing: '0.06em',
                  }}
                >{l}</motion.button>
              ))}
            </div>
          </motion.div>

          {/* Chart */}
          <motion.div
            className="bi-card"
            variants={fadeUp} custom={1} initial="hidden" animate="visible"
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <h2 className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', margin: 0 }}>{t('historical.chartTitle')}</h2>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>{t('historical.chartSubtitle')}</div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg
                viewBox="0 0 800 320"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                style={{ display: 'block', cursor: 'pointer' }}
                onClick={handleChartClick}
                onMouseMove={handleChartMouseMove}
                onMouseLeave={handleChartMouseLeave}
                onTouchStart={handleChartTouchStart}
              >
                {[0,1,2,3,4].map((i) => (
                  <line key={i} x1="40" x2="790" y1={30 + i * 60} y2={30 + i * 60} stroke="var(--hairline)" strokeDasharray="2 4" style={{ pointerEvents: 'none' }} />
                ))}
                {[0,25,50,75,100].map((m, i) => (
                  <text key={m} x="30" y={30 + (4-i)*60+3} fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor="end" style={{ pointerEvents: 'none' }}>{m}</text>
                ))}
                <rect x="40" y="30" width="750" height="60" fill="var(--t-8)" opacity="0.05" style={{ pointerEvents: 'none' }} />
                <text x="60" y="52" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.12em" fill="var(--t-8)" opacity="0.8" style={{ pointerEvents: 'none' }}>{t('historical.bubbleLabel')}</text>

                {/* Crisis markers with staggered fade-in */}
                {crisisMarkers.map((m, i) => (
                  <motion.g
                    key={m.year}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.07, duration: 0.3 }}
                    style={{ pointerEvents: 'none' }}
                  >
                    <line x1={m.x} x2={m.x} y1="30" y2="270" stroke="var(--hairline-2)" strokeDasharray="3 3" strokeWidth="1" />
                    <text x={m.x} y="285" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor="middle">{m.label}</text>
                  </motion.g>
                ))}

                {/* Animated chart line */}
                {chartPath && (
                  <motion.path
                    key={activeRange}
                    d={chartPath}
                    fill="none"
                    stroke="var(--ink-1)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ pathLength: { duration: 1.4, ease: 'easeInOut' as const }, opacity: { duration: 0.3 } }}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Highlight hovered date */}
                {hoveredDate && hoveredDate !== selectedDate && filtered.length >= 2 && (() => {
                  const idx = filtered.findIndex(s => s.snapshot_date === hoveredDate);
                  if (idx < 0) return null;
                  const x = 40 + (idx / (filtered.length - 1)) * 750;
                  const y = 30 + (1 - filtered[idx].composite_score / 100) * 240;
                  const color = tempVar(filtered[idx].composite_score);
                  return (
                    <g style={{ pointerEvents: 'none' }}>
                      <line x1={x} x2={x} y1="30" y2="270" stroke="var(--hairline-2)" strokeWidth="1.2" strokeDasharray="3 3" />
                      <circle cx={x} cy={y} r="4.5" fill={color} opacity="0.75" />
                    </g>
                  );
                })()}

                {/* Highlight selected date */}
                {selectedDate && filtered.length >= 2 && (() => {
                  const idx = filtered.findIndex(s => s.snapshot_date === selectedDate);
                  if (idx < 0) return null;
                  const x = 40 + (idx / (filtered.length - 1)) * 750;
                  const y = 30 + (1 - filtered[idx].composite_score / 100) * 240;
                  return (
                    <motion.g
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      style={{ pointerEvents: 'none' }}
                    >
                      <line x1={x} x2={x} y1="30" y2="270" stroke="var(--t-7)" strokeWidth="1.5" />
                      <circle cx={x} cy={y} r="5.5" fill="var(--t-7)" stroke="var(--bg)" strokeWidth="1.5" />
                    </motion.g>
                  );
                })()}

                {filtered.length === 0 && (
                  <text x="400" y="160" fontSize="13" fontFamily="var(--font-mono)" fill="var(--ink-4)" textAnchor="middle" style={{ pointerEvents: 'none' }}>{t('historical.noData')}</text>
                )}
              </svg>
            </div>
          </motion.div>

          {/* Month/Year selector */}
          <motion.div
            className="bi-card"
            variants={fadeUp} custom={2} initial="hidden" animate="visible"
            style={{ textAlign: isRtl ? 'right' : 'left' }}
          >
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.10em', marginBottom: 12 }}>{t('historical.selectMonth')}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--hairline)', borderRadius: 6, background: 'var(--panel-2)', padding: 2 }}>
                <button
                  onClick={() => goToYear(yearIndex + 1)}
                  disabled={yearIndex < 0 || yearIndex >= years.length - 1}
                  aria-label="Previous year"
                  style={{
                    width: 24, height: 24, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 4,
                    background: 'transparent', color: 'var(--ink-2)', fontSize: 13, lineHeight: 1,
                    cursor: yearIndex >= years.length - 1 ? 'default' : 'pointer',
                    opacity: yearIndex < 0 || yearIndex >= years.length - 1 ? 0.35 : 1,
                  }}
                >‹</button>
                <span style={{ fontSize: 12, color: 'var(--ink-1)', minWidth: 42, textAlign: 'center', letterSpacing: '0.04em' }}>{selectedYear}</span>
                <button
                  onClick={() => goToYear(yearIndex - 1)}
                  disabled={yearIndex <= 0}
                  aria-label="Next year"
                  style={{
                    width: 24, height: 24, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 4,
                    background: 'transparent', color: 'var(--ink-2)', fontSize: 13, lineHeight: 1,
                    cursor: yearIndex <= 0 ? 'default' : 'pointer',
                    opacity: yearIndex <= 0 ? 0.35 : 1,
                  }}
                >›</button>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                {monthsForYear.map((s, month) => {
                  if (!s) {
                    return (
                      <span
                        key={`${selectedYear}-${month}`}
                        className="mono"
                        style={{
                          fontSize: 11, padding: '5px 9px', borderRadius: 6,
                          border: '1px solid var(--hairline)', background: 'var(--panel-2)',
                          color: 'var(--ink-4)', opacity: 0.4, letterSpacing: '0.04em',
                        }}
                      >{localizedMonths[month]}</span>
                    );
                  }
                  const isSelected = selectedDate === s.snapshot_date;
                  const tone = tempVar(s.composite_score);
                  return (
                    <motion.button
                      key={`${selectedYear}-${month}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: month * 0.03, duration: 0.22, ease: 'easeOut' as const }}
                      onClick={() => setSelectedDate(isSelected ? null : s.snapshot_date)}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 9px', borderRadius: 6,
                        border: `1px solid ${isSelected ? tone : 'var(--hairline)'}`,
                        background: isSelected ? `color-mix(in srgb, ${tone} 20%, var(--panel-2))` : 'var(--panel-2)',
                        color: isSelected ? tone : 'var(--ink-2)',
                        cursor: 'pointer', letterSpacing: '0.04em',
                      }}
                    >{localizedMonths[month]}</motion.button>
                  );
                })}
              </div>
            </div>

            {/* Detail card with AnimatePresence */}
            <AnimatePresence>
              {detailSnap && (
                <motion.div
                  key={detailSnap.snapshot_date}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' as const }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '14px 16px', background: 'var(--panel-3)', borderRadius: 8, border: '1px solid var(--hairline)', direction: isRtl ? 'rtl' : 'ltr' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                      <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.10em' }}>{detailSnap.snapshot_date}</div>
                        <div className="mono" style={{ fontSize: 11, color: tempVar(detailSnap.composite_score), marginTop: 3, letterSpacing: '0.08em' }}>
                          {t(`riskTiers.${riskTier(detailSnap.composite_score).tier.toLowerCase() as any}.tier`).toUpperCase()}
                        </div>
                      </div>
                      <motion.div
                        className="mono tnum"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, duration: 0.28 }}
                        style={{ fontSize: 36, lineHeight: 1, color: tempVar(detailSnap.composite_score), fontWeight: 500 }}
                      >
                        {detailSnap.composite_score.toFixed(1)}
                      </motion.div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8 }}>
                      {[
                        { label: ABBR.valuation, score: detailSnap.valuation_score },
                        { label: ABBR.macro_stress, score: detailSnap.macro_stress_score },
                        { label: ABBR.leverage_credit, score: detailSnap.leverage_credit_score },
                        { label: ABBR.sentiment, score: detailSnap.sentiment_score },
                        { label: ABBR.concentration, score: detailSnap.concentration_score },
                      ].map((cat, i) => (
                        <motion.div
                          key={cat.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.06, duration: 0.24 }}
                          style={{ textAlign: 'center' }}
                        >
                          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.06em', marginBottom: 4 }}>{cat.label}</div>
                          <div className="mono tnum" style={{ fontSize: 18, color: tempVar(cat.score), fontWeight: 500 }}>{cat.score.toFixed(0)}</div>
                          <div style={{ height: 3, background: 'var(--panel)', borderRadius: 2, marginTop: 4 }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${cat.score}%` }}
                              transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: 'easeOut' as const }}
                              style={{ height: '100%', background: tempVar(cat.score), borderRadius: 2 }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* RIGHT — similarity cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0, overflow: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
          <motion.div
            className="bi-eyebrow"
            variants={fadeRight} custom={0} initial="hidden" animate="visible"
          >{t('historical.historicalSimilarity')}</motion.div>
          {(similarities.length > 0 ? similarities : [
            { crisis_id:'2000_dotcom', display_name:'2000 · Dot-com Bubble', peak_score:94, drawdown_pct:-78, similarity_score:82, peak_date: '2000-03-10' },
            { crisis_id:'1929_crash',  display_name:'1929 · Wall St. Crash',  peak_score:89, drawdown_pct:-89, similarity_score:64, peak_date: '1929-09-03' },
            { crisis_id:'2021_meme',   display_name:'2021 · Meme / SPAC Era', peak_score:86, drawdown_pct:-25, similarity_score:71, peak_date: '2021-11-22' },
            { crisis_id:'2007_gfc',    display_name:'2008 · Subprime / GFC',  peak_score:81, drawdown_pct:-57, similarity_score:41, peak_date: '2007-10-09' },
            { crisis_id:'2020_covid',  display_name:'2020 · Covid Crash',     peak_score:67, drawdown_pct:-34, similarity_score:22, peak_date: '2020-02-19' },
          ] as any[]).map((era, i) => (
            <motion.div
              key={era.crisis_id}
              className="bi-card bi-hoverable"
              custom={i + 1}
              variants={fadeRight}
              initial="hidden"
              animate="visible"
              onClick={() => handleSelectEra(era)}
              style={{ padding: 'calc(var(--pad-card) * 0.66)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-1)' }}>{getLocalizedCrisisName(era)}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCrisisInfo(era);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 4,
                        cursor: 'pointer',
                        color: 'var(--ink-3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--ink-1)';
                        e.currentTarget.style.backgroundColor = 'var(--panel-3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--ink-3)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Learn more about this crisis"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4, letterSpacing: '0.06em' }}>
                    {t('historical.peakAndDrawdown', { peak: era.peak_score, drawdown: era.drawdown_pct })}
                  </div>
                </div>
                <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                  <div className="mono tnum" style={{ fontSize: 22, color: tempVar(era.similarity_score), fontWeight: 500 }}>
                    {era.similarity_score}<span style={{ fontSize: 13, color: 'var(--ink-4)' }}>%</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em', marginTop: 2 }}>{t('historical.similarityToToday')}</div>
                </div>
              </div>
              <div style={{ height: 3, marginTop: 12, background: 'var(--panel-3)', borderRadius: 2 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${era.similarity_score}%` }}
                  transition={{ delay: 0.4 + i * 0.09, duration: 0.7, ease: 'easeOut' as const }}
                  style={{ height: '100%', background: tempVar(era.similarity_score), borderRadius: 2 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Crisis Info Modal */}
      <AnimatePresence>
        {activeCrisisInfo && (() => {
          const detailKey = activeCrisisInfo.crisis_id;
          const translatedName = t(`historical.crises.${detailKey}.name`);
          const name = translatedName !== `historical.crises.${detailKey}.name` ? translatedName : activeCrisisInfo.display_name;
          const period = t(`historical.crises.${detailKey}.period`) !== `historical.crises.${detailKey}.period` ? t(`historical.crises.${detailKey}.period`) : '—';
          const peakVal = activeCrisisInfo.peak_score ?? t(`historical.crises.${detailKey}.peak`);
          const drawdownVal = activeCrisisInfo.drawdown_pct ?? t(`historical.crises.${detailKey}.drawdown`);
          const recovery = t(`historical.crises.${detailKey}.recovery`) !== `historical.crises.${detailKey}.recovery` ? t(`historical.crises.${detailKey}.recovery`) : '—';
          const why = t(`historical.crises.${detailKey}.why`) !== `historical.crises.${detailKey}.why` ? t(`historical.crises.${detailKey}.why`) : '—';
          const summary = t(`historical.crises.${detailKey}.summary`) !== `historical.crises.${detailKey}.summary` ? t(`historical.crises.${detailKey}.summary`) : '';

          return (
            <div
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 10000,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(5, 5, 7, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              onClick={() => setActiveCrisisInfo(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  width: '90%',
                  maxWidth: isMobile ? '95vw' : 580,
                  background: 'var(--panel)',
                  border: '1px solid var(--hairline-2)',
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  direction: isRtl ? 'rtl' : 'ltr',
                  textAlign: isRtl ? 'right' : 'left'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button (top right/left) */}
                <button
                  onClick={() => setActiveCrisisInfo(null)}
                  style={{
                    position: 'absolute',
                    top: 20,
                    right: isRtl ? 'auto' : 20,
                    left: isRtl ? 20 : 'auto',
                    background: 'var(--panel-2)',
                    border: '1px solid var(--hairline)',
                    color: 'var(--ink-3)',
                    width: 28, height: 28,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'grid', placeItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--ink-1)';
                    e.currentTarget.style.borderColor = 'var(--hairline-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--ink-3)';
                    e.currentTarget.style.borderColor = 'var(--hairline)';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <div>
                  <div className="bi-eyebrow" style={{ color: 'var(--t-8)' }}>{period}</div>
                  <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink-1)', marginTop: 4 }}>{name}</h2>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: '12px 16px', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 10, textAlign: isRtl ? 'right' : 'left' }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>{t('historical.peakScoreDrawdown')}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-1)', marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 6, flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: isRtl ? 'flex-start' : 'flex-start' }}>
                      <span className="mono">{peakVal}</span>
                      <span className="mono" style={{ fontSize: 13, color: 'var(--t-3)', fontWeight: 500 }}>
                        {t('historical.drawdownLabel', { drawdown: String(drawdownVal).replace('-', '') })}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', background: 'var(--panel-2)', border: '1px solid var(--hairline)', borderRadius: 10, textAlign: isRtl ? 'right' : 'left' }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>{t('historical.recoveryTime')}</div>
                    <div className="mono" style={{ fontSize: 13, color: 'var(--t-8)', fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>
                      {recovery}
                    </div>
                  </div>
                </div>

                {/* Description section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{t('historical.whatHappened')}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, textWrap: 'pretty' }}>
                    {why}
                  </div>
                </div>

                {summary && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'color-mix(in srgb, var(--t-8) 8%, var(--panel-2))',
                    borderLeft: isRtl ? 'none' : '3px solid var(--t-8)',
                    borderRight: isRtl ? '3px solid var(--t-8)' : 'none',
                    borderRadius: isRtl ? '8px 0 0 8px' : '0 8px 8px 0',
                    fontSize: 13.5,
                    color: 'var(--ink-1)',
                    lineHeight: 1.45,
                    fontStyle: 'italic'
                  }}>
                    {summary}
                  </div>
                )}

                {/* Bottom action button */}
                <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={() => setActiveCrisisInfo(null)}
                    style={{
                      background: 'var(--panel-3)',
                      border: '1px solid var(--hairline-2)',
                      color: 'var(--ink-1)',
                      padding: '10px 20px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                      e.currentTarget.style.borderColor = 'var(--ink-4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--panel-3)';
                      e.currentTarget.style.borderColor = 'var(--hairline-2)';
                    }}
                  >
                    {t('common.closeExplanation')}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      <style jsx global>{`
        .historical-grid {
          grid-template-columns: minmax(0, 1fr) 380px;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .historical-grid {
            grid-template-columns: minmax(0, 1fr);
            overflow: visible;
          }
        }
      `}</style>
    </div>
  );
}
