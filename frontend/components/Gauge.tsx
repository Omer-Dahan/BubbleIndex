'use client';
import GaugeRadial from './GaugeRadial';
import { riskTier, scaleTone, tempVar } from '@/lib/utils';
import type { GaugeKind } from '@/lib/types';

interface Props {
  kind?: GaugeKind;
  score: number;
  size?: number;
}

function GaugeArc({ score, size = 380 }: { score: number; size?: number }) {
  const w = size, h = size * 0.66;
  const cx = w / 2, cy = h * 0.95;
  const r = w * 0.42;
  const tier = riskTier(score);
  const startA = 180, endA = 360;
  const valueA = startA + (score / 100) * (endA - startA);
  const polar = (a: number, rr: number): [number, number] => [
    cx + rr * Math.cos((a * Math.PI) / 180),
    cy + rr * Math.sin((a * Math.PI) / 180),
  ];
  const arc = (a0: number, a1: number, rr: number) => {
    const [x0, y0] = polar(a0, rr);
    const [x1, y1] = polar(a1, rr);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${rr} ${rr} 0 ${large} 1 ${x1} ${y1}`;
  };
  const segs = 80;
  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} width={w} height={h + 30}>
      <path d={arc(startA, endA, r)} fill="none" stroke="var(--panel-3)" strokeWidth="20" strokeLinecap="round" />
      {Array.from({ length: segs }).map((_, i) => {
        const t0 = i / segs, t1 = (i + 1) / segs;
        const a0 = startA + t0 * 180, a1 = startA + t1 * 180;
        if (t1 > score / 100) return null;
        return <path key={i} d={arc(a0, a1, r)} fill="none"
          stroke={tempVar(t0 * 100)} strokeWidth="20" strokeLinecap="butt" opacity="0.95" />;
      })}
      {[0, 25, 50, 75, 100].map((m) => {
        const a = startA + (m / 100) * 180;
        const [lx, ly] = polar(a, r + 26);
        return <text key={m} x={lx} y={ly} fill="var(--ink-4)" fontSize="10"
          fontFamily="var(--font-mono)" textAnchor="middle">{m}</text>;
      })}
      {(() => {
        const [nx, ny] = polar(valueA, r);
        return <circle cx={nx} cy={ny} r="14" fill="var(--bg)" stroke={tier.tone} strokeWidth="3" />;
      })()}
      <text x={cx} y={cy - 30} fill="var(--ink-1)" fontSize="72" fontWeight="300"
        fontFamily="var(--font-display)" textAnchor="middle" style={{ letterSpacing: '-0.04em' }}>{score}</text>
      <text x={cx} y={cy - 5} fill={tier.tone} fontSize="10" letterSpacing="0.22em" fontWeight="600"
        fontFamily="var(--font-mono)" textAnchor="middle">{tier.tier} · {tier.verb}</text>
    </svg>
  );
}

function GaugeBar({ score, width = 520 }: { score: number; width?: number }) {
  const tier = riskTier(score);
  return (
    <div style={{ width, fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="bi-eyebrow">BUBBLE INDEX</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 4 }}>
            <div className="bi-bignum" style={{ fontSize: 96 }}>{score}</div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', fontWeight: 600, color: tier.tone }}>
              {tier.tier} · {tier.verb}
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', height: 14, borderRadius: 7, background: 'var(--panel-3)', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, var(--t-1), var(--t-3), var(--t-5), var(--t-7), var(--t-9))',
          opacity: 0.85,
        }} />
        <div style={{
          position: 'absolute', top: -4, bottom: -4,
          left: `calc(${score}% - 2px)`, width: 4,
          background: 'var(--ink-1)', borderRadius: 2,
        }} />
      </div>
      <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--ink-4)' }}>
        <span>0 STABLE</span><span>25</span><span>50</span><span>75</span><span>100 BUBBLE</span>
      </div>
    </div>
  );
}

function GaugeAbstract({ score, size = 380 }: { score: number; size?: number }) {
  const tier = riskTier(score);
  const rings = 6;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {Array.from({ length: rings }).map((_, i) => {
        const r = (i + 1) * (size / 2.8) / rings;
        const on = (i + 1) / rings <= score / 100;
        return <circle key={i} cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={on ? tempVar((i / rings) * 100) : 'var(--ink-5)'}
          strokeWidth={on ? 2.5 : 1} strokeOpacity={on ? 0.85 : 0.4}
          strokeDasharray={on ? '0' : '2 6'} />;
      })}
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 14} fill="none"
        stroke="var(--hairline)" strokeDasharray="1 8" />
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle"
        fontSize="84" fontWeight="300" fill="var(--ink-1)"
        fontFamily="var(--font-display)" style={{ letterSpacing: '-0.04em' }}>{score}</text>
      <text x={size / 2} y={size / 2 + 42} textAnchor="middle"
        fontSize="11" letterSpacing="0.22em" fontWeight="600" fill={tier.tone}
        fontFamily="var(--font-mono)">{tier.tier} · {tier.verb}</text>
    </svg>
  );
}

export default function Gauge({ kind = 'radial', score, size }: Props) {
  if (kind === 'arc') return <GaugeArc score={score} size={size} />;
  if (kind === 'bar') return <GaugeBar score={score} width={size} />;
  if (kind === 'abstract') return <GaugeAbstract score={score} size={size} />;
  return <GaugeRadial score={score} size={size} />;
}
