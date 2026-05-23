'use client';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Topbar from './Topbar';
import { tempVar, makeSeries } from '@/lib/utils';
import type { RiskScoreResponse, SnapshotSummary, Palette } from '@/lib/types';

interface Props {
  data: RiskScoreResponse | null;
  snapshots: SnapshotSummary[];
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
  onOpenTweaks?: () => void;
}

const CRISIS_EVENTS = [
  { year: 1990, label: '1990 Recession' },
  { year: 1994, label: '94 Bond Crisis' },
  { year: 2000, label: 'Dot-com Peak' },
  { year: 2008, label: 'GFC' },
  { year: 2020, label: 'Covid Crash' },
  { year: 2022, label: '2022 Bear' },
];

type Speed = '1×' | '2×' | '8×' | '64×';
const SPEED_MS: Record<Speed, number> = { '1×': 600, '2×': 300, '8×': 80, '64×': 20 };

export default function ScreenReplay({ data, snapshots, palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
  const sorted = useMemo(() =>
    [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
  [snapshots]);

  const usingRealData = sorted.length >= 4;

  // Fallback: generate 600-point simulated series when no real snapshots exist
  const fallback = useMemo(() => makeSeries(600, 31, 0.04, 0.58), []);

  const [scrubIdx, setScrubIdx] = useState(() =>
    usingRealData ? sorted.length - 1 : Math.round(0.97 * 599)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('8×');
  const scrubberRef = useRef<HTMLDivElement>(null);

  const totalPoints = usingRealData ? sorted.length : 600;
  const clampedIdx = Math.min(Math.max(scrubIdx, 0), totalPoints - 1);

  // Auto-reset scrubIdx when data loads
  useEffect(() => {
    if (usingRealData) setScrubIdx(sorted.length - 1);
  }, [usingRealData, sorted.length]);

  // Playback interval
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setScrubIdx(prev => {
        if (prev >= totalPoints - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, SPEED_MS[speed]);
    return () => clearInterval(id);
  }, [isPlaying, speed, totalPoints]);

  const handleScrubClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = scrubberRef.current?.getBoundingClientRect();
    if (!rect) return;
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setScrubIdx(Math.round(frac * (totalPoints - 1)));
    setIsPlaying(false);
  }, [totalPoints]);

  const handlePlayControl = (action: 'rewind' | 'play' | 'forward') => {
    if (action === 'rewind')  { setScrubIdx(0); setIsPlaying(false); }
    else if (action === 'forward') { setScrubIdx(totalPoints - 1); setIsPlaying(false); }
    else setIsPlaying(p => !p);
  };

  // Current snapshot info at scrub position
  const currentSnap = usingRealData ? sorted[clampedIdx] : null;
  const currentScore = currentSnap
    ? currentSnap.composite_score
    : Math.round((usingRealData ? 0 : fallback[clampedIdx] ?? 0.58) * 100);
  const currentDate = currentSnap
    ? currentSnap.snapshot_date
    : `${1900 + Math.round((clampedIdx / 599) * 125)}-01-01`;

  const scrubFrac = totalPoints > 1 ? clampedIdx / (totalPoints - 1) : 0;

  // Build SVG path
  const chartPath = useMemo(() => {
    const pts = usingRealData ? sorted : fallback.map((v, i) => ({ composite_score: v * 100, _i: i }));
    if (pts.length < 2) return '';
    return pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * 1280;
      const score = usingRealData ? (p as SnapshotSummary).composite_score : (p as { composite_score: number }).composite_score;
      const y = 20 + (1 - score / 100) * 260;
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  }, [usingRealData, sorted, fallback]);

  // Crisis marker positions
  const crisisMarkers = useMemo(() => {
    if (!usingRealData || sorted.length < 2) return [];
    const firstMs = new Date(sorted[0].snapshot_date).getTime();
    const lastMs  = new Date(sorted[sorted.length - 1].snapshot_date).getTime();
    const span = lastMs - firstMs;
    return CRISIS_EVENTS.flatMap(ev => {
      const t = new Date(`${ev.year}-06-01`).getTime();
      if (t < firstMs || t > lastMs) return [];
      return [{ ...ev, x: ((t - firstMs) / span) * 1280 }];
    });
  }, [usingRealData, sorted]);

  // Scrubber position label — dynamic year marks
  const scrubYears = useMemo(() => {
    if (usingRealData && sorted.length >= 2) {
      const first = parseInt(sorted[0].snapshot_date.slice(0, 4));
      const last  = parseInt(sorted[sorted.length - 1].snapshot_date.slice(0, 4));
      const step  = Math.ceil((last - first) / 5);
      return Array.from({ length: 6 }, (_, i) => Math.min(first + i * step, last));
    }
    return [1900, 1925, 1950, 1975, 2000, 2025];
  }, [usingRealData, sorted]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="replay" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="bi-eyebrow">MARKET REPLAY</div>
            <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--ink-1)' }}>
              {usingRealData
                ? `${sorted[0]?.snapshot_date?.slice(0, 4)} → today — ${sorted.length} monthly snapshots.`
                : '125 years of risk, scrubbed.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {([['◀◀', 'rewind'], ['▶', 'play'], ['▶▶', 'forward']] as [string, 'rewind' | 'play' | 'forward'][]).map(([icon, action]) => (
              <button
                key={action}
                onClick={() => handlePlayControl(action)}
                style={{
                  width: 38, height: 34, display: 'grid', placeItems: 'center',
                  border: '1px solid var(--hairline)',
                  background: (action === 'play' && isPlaying) ? 'var(--panel-3)' : 'var(--panel-2)',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: (action === 'play' && isPlaying) ? 'var(--ink-1)' : 'var(--ink-2)',
                  cursor: 'pointer',
                }}
              >{action === 'play' ? (isPlaying ? '⏸' : '▶') : icon}</button>
            ))}
            <div style={{ width: 1, background: 'var(--hairline)', margin: '0 4px', height: 24 }} />
            {(['1×', '2×', '8×', '64×'] as Speed[]).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  width: 38, height: 34, display: 'grid', placeItems: 'center',
                  border: '1px solid var(--hairline)', borderRadius: 8,
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: speed === s ? 'var(--ink-1)' : 'var(--ink-3)',
                  background: speed === s ? 'var(--panel-3)' : 'var(--panel-2)',
                  cursor: 'pointer', letterSpacing: '0.04em',
                }}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>
              RISK SCORE · {usingRealData ? `${sorted[0]?.snapshot_date?.slice(0, 4)} → TODAY` : '1900 → TODAY'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>{currentDate}</div>
              <div className="mono" style={{ fontSize: 16, color: tempVar(currentScore), fontWeight: 600 }}>
                {currentScore}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <svg viewBox="0 0 1280 360" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="0" x2="1280" y1={20 + i * 65} y2={20 + i * 65} stroke="var(--hairline)" strokeDasharray="2 4" />
              ))}
              <rect x="0" y="20" width="1280" height="65" fill="var(--t-8)" opacity="0.04" />

              {chartPath && (
                <>
                  <defs>
                    <linearGradient id="replayAreaGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="var(--t-9)" />
                      <stop offset="1" stopColor="var(--t-1)" />
                    </linearGradient>
                  </defs>
                  <path d={chartPath + ' L 1280 280 L 0 280 Z'} fill="url(#replayAreaGrad)" opacity="0.12" />
                  <motion.path
                    d={chartPath}
                    fill="none"
                    stroke="var(--ink-2)"
                    strokeWidth="1.4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                  />
                </>
              )}

              {crisisMarkers.map(m => (
                <g key={m.year}>
                  <line x1={m.x} x2={m.x} y1="20" y2="280"
                    stroke="var(--hairline-2)" strokeDasharray="2 3" strokeWidth="1" opacity="0.8" />
                  <text x={m.x} y="300" fontSize="9" fontFamily="var(--font-mono)"
                    fill="var(--ink-4)" textAnchor="middle" letterSpacing="0.04em">
                    {m.year}
                  </text>
                  <text x={m.x} y="314" fontSize="8" fontFamily="var(--font-mono)"
                    fill="var(--ink-5)" textAnchor="middle">
                    {m.label.toUpperCase()}
                  </text>
                </g>
              ))}

              {/* Scrub cursor */}
              {(() => {
                const x = scrubFrac * 1280;
                const y = currentSnap
                  ? 20 + (1 - currentScore / 100) * 260
                  : 20 + (1 - (fallback[clampedIdx] ?? 0.58)) * 260;
                return (
                  <g>
                    <line x1={x} x2={x} y1="20" y2="280" stroke="var(--ink-1)" strokeWidth="1.5" opacity="0.7" />
                    <circle cx={x} cy={y} r="5" fill={tempVar(currentScore)} stroke="var(--bg)" strokeWidth="2" />
                  </g>
                );
              })()}

              {[0, 25, 50, 75, 100].map((m, i) => (
                <text key={m} x="8" y={20 + (4 - i) * 65 + 4} fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-4)">{m}</text>
              ))}
            </svg>
          </div>

          {/* Scrubber */}
          <div
            ref={scrubberRef}
            onClick={handleScrubClick}
            style={{ marginTop: 16, position: 'relative', height: 36, cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 3, borderRadius: 2, background: 'linear-gradient(to right, var(--t-1), var(--t-9))', opacity: 0.4 }} />
            {/* Progress fill */}
            <div style={{ position: 'absolute', top: 12, left: 0, width: `${scrubFrac * 100}%`, height: 3, borderRadius: 2, background: 'linear-gradient(to right, var(--t-1), var(--t-9))', opacity: 0.85 }} />
            {scrubYears.map((y, i) => (
              <div key={y} style={{ position: 'absolute', left: `${(i / 5) * 100}%`, top: 20, transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>{y}</div>
            ))}
            {/* Thumb */}
            <motion.div
              animate={{ left: `${scrubFrac * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'absolute', top: 4, transform: 'translateX(-50%)',
                width: 22, height: 22, borderRadius: 11,
                border: '2px solid var(--ink-1)', background: 'var(--bg)',
                boxShadow: `0 0 0 4px color-mix(in srgb, ${tempVar(currentScore)} 30%, transparent)`,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
