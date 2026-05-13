'use client';
import { useMemo, useState } from 'react';
import Topbar from './Topbar';
import { tempVar, makeSeries } from '@/lib/utils';
import type { RiskScoreResponse, Palette } from '@/lib/types';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (s: string) => void;
  onOpenTweaks?: () => void;
}

const MARKERS = [
  { year: 1929, x: 0.20, label: 'Black Tuesday', score: 89 },
  { year: 1973, x: 0.40, label: 'Oil Shock',     score: 71 },
  { year: 1987, x: 0.52, label: 'Black Monday',  score: 78 },
  { year: 2000, x: 0.66, label: 'Dot-com Peak',  score: 94 },
  { year: 2008, x: 0.74, label: 'GFC',           score: 81 },
  { year: 2020, x: 0.85, label: 'Covid Crash',   score: 67 },
  { year: 2025, x: 0.97, label: 'TODAY',         score: 72 },
];

type Speed = '1×' | '2×' | '8×' | '64×';
type PlayState = 'rewind' | 'paused' | 'playing';

export default function ScreenReplay({ data, palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
  const [speed, setSpeed] = useState<Speed>('8×');
  const [playState, setPlayState] = useState<PlayState>('paused');
  const long = useMemo(() => makeSeries(600, 31, 0.04, 0.58), []);
  const scrubX = 0.97;

  const handlePlayControl = (action: 'rewind' | 'play' | 'forward') => {
    if (action === 'rewind') setPlayState('rewind');
    else if (action === 'play') setPlayState(s => s === 'playing' ? 'paused' : 'playing');
    else setPlayState('playing');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar active="replay" palette={palette} onCyclePalette={onCyclePalette} onNavigate={onNavigate} onOpenTweaks={onOpenTweaks} />
      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)', minHeight: 0 }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="bi-eyebrow">MARKET REPLAY</div>
            <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--ink-1)' }}>
              125 years of risk, scrubbed.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Playback controls */}
            {([['◀◀', 'rewind'], ['▶', 'play'], ['▶▶', 'forward']] as [string, 'rewind' | 'play' | 'forward'][]).map(([icon, action]) => (
              <button
                key={action}
                onClick={() => handlePlayControl(action)}
                style={{
                  width: 38, height: 34, display: 'grid', placeItems: 'center',
                  border: '1px solid var(--hairline)',
                  background: (action === 'play' && playState === 'playing') ? 'var(--panel-3)' : 'var(--panel-2)',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: (action === 'play' && playState === 'playing') ? 'var(--ink-1)' : 'var(--ink-2)',
                  cursor: 'pointer',
                }}
              >{icon}</button>
            ))}
            <div style={{ width: 1, background: 'var(--hairline)', margin: '0 4px', height: 24 }} />
            {/* Speed controls */}
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
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="bi-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>RISK SCORE · 1900 → TODAY</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-1)' }}>
              2025 · <span style={{ color: 'var(--t-7)' }}>{data?.composite_score ?? 72} {data?.risk_label ?? 'HIGH'}</span>
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <svg viewBox="0 0 1280 360" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
              {[0,1,2,3,4].map((i) => (
                <line key={i} x1="0" x2="1280" y1={20 + i * 65} y2={20 + i * 65} stroke="var(--hairline)" strokeDasharray="2 4" />
              ))}
              <rect x="0" y="20" width="1280" height="65" fill="var(--t-8)" opacity="0.04" />
              {(() => {
                const d = long.map((v, i) => {
                  const x = (i / (long.length - 1)) * 1280;
                  const y = 20 + (1 - v) * 260;
                  return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
                }).join(' ');
                return <>
                  <defs>
                    <linearGradient id="tempGradReplay" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="var(--t-9)" />
                      <stop offset="1" stopColor="var(--t-1)" />
                    </linearGradient>
                  </defs>
                  <path d={d + ' L 1280 280 L 0 280 Z'} fill="url(#tempGradReplay)" opacity="0.18" />
                  <path d={d} fill="none" stroke="var(--ink-2)" strokeWidth="1.2" />
                </>;
              })()}
              {MARKERS.map((m) => (
                <g key={m.year}>
                  <line x1={m.x * 1280} x2={m.x * 1280} y1="20" y2="280"
                    stroke={m.year === 2025 ? 'var(--ink-1)' : tempVar(m.score)}
                    strokeDasharray={m.year === 2025 ? '0' : '2 3'}
                    strokeWidth={m.year === 2025 ? 1.6 : 1} opacity="0.85" />
                  <circle cx={m.x * 1280} cy={20 + (1 - m.score / 100) * 260} r="4"
                    fill={m.year === 2025 ? 'var(--ink-1)' : tempVar(m.score)} />
                  <text x={m.x * 1280} y="305" fontSize="11" fontFamily="var(--font-mono)"
                    fill={m.year === 2025 ? 'var(--ink-1)' : 'var(--ink-3)'}
                    textAnchor="middle" letterSpacing="0.06em">{m.year}</text>
                  <text x={m.x * 1280} y="322" fontSize="10" fontFamily="var(--font-mono)"
                    fill="var(--ink-4)" textAnchor="middle" letterSpacing="0.04em">{m.label.toUpperCase()}</text>
                </g>
              ))}
              {[0, 25, 50, 75, 100].map((m, i) => (
                <text key={m} x="8" y={20 + (4 - i) * 65 + 4} fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-4)">{m}</text>
              ))}
            </svg>
          </div>
          {/* Scrubber */}
          <div style={{ marginTop: 16, position: 'relative', height: 30 }}>
            <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 3, borderRadius: 2, background: 'linear-gradient(to right, var(--t-1), var(--t-9))', opacity: 0.5 }} />
            {([1900, 1925, 1950, 1975, 2000, 2025] as number[]).map((y, i) => (
              <div key={y} style={{ position: 'absolute', left: `${(i / 5) * 100}%`, top: 18, transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>{y}</div>
            ))}
            <div style={{ position: 'absolute', left: `${scrubX * 100}%`, top: 4, transform: 'translateX(-50%)', width: 20, height: 20, borderRadius: 10, border: '2px solid var(--ink-1)', background: 'var(--bg)', boxShadow: '0 0 0 4px color-mix(in srgb, var(--t-7) 25%, transparent)', cursor: 'grab' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
