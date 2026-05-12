'use client';
import { riskTier, scaleTone } from '@/lib/utils';

interface Props { score: number; size?: number; }

export default function GaugeRadial({ score, size = 360 }: Props) {
  const cx = size / 2, cy = size * 0.56;
  const r = size * 0.40;
  const tier = riskTier(score);
  const startA = -200, endA = 20;
  const valueA = startA + (score / 100) * (endA - startA);
  const arcWidth = size * 0.085;

  const polar = (angle: number, radius: number): [number, number] => {
    const a = (angle * Math.PI) / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };
  const arcPath = (a0: number, a1: number, rr: number) => {
    const [x0, y0] = polar(a0, rr);
    const [x1, y1] = polar(a1, rr);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${rr} ${rr} 0 ${large} 1 ${x1} ${y1}`;
  };

  const majors = [0, 25, 50, 75, 100];
  const uid = `g${(Math.abs(score * 1000 + size)) | 0}`;
  const gradActive = `grad-active-${uid}`;
  const gradInactive = `grad-inactive-${uid}`;
  const gradNeedle = `grad-needle-${uid}`;
  const filterGlow = `glow-${uid}`;

  const [gx1, gy1] = polar(startA, r);
  const [gx2, gy2] = polar(endA, r);
  const tone = scaleTone(score);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <linearGradient id={gradActive} gradientUnits="userSpaceOnUse"
          x1={gx1} y1={gy1} x2={gx2} y2={gy2}>
          <stop offset="0" stopColor="var(--t-1)" />
          <stop offset="0.25" stopColor="var(--t-3)" />
          <stop offset="0.50" stopColor="var(--t-5)" />
          <stop offset="0.70" stopColor="var(--t-7)" />
          <stop offset="0.85" stopColor="var(--t-8)" />
          <stop offset="1" stopColor="var(--t-9)" />
        </linearGradient>
        <linearGradient id={gradInactive} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, var(--ink-1) 14%, var(--panel))" />
          <stop offset="1" stopColor="var(--panel-2)" />
        </linearGradient>
        <linearGradient id={gradNeedle} gradientUnits="userSpaceOnUse"
          x1={cx} y1={cy}
          x2={cx + (r - arcWidth * 0.55) * Math.cos((valueA * Math.PI) / 180)}
          y2={cy + (r - arcWidth * 0.55) * Math.sin((valueA * Math.PI) / 180)}>
          <stop offset="0" stopColor="var(--ink-1)" stopOpacity="0" />
          <stop offset="0.55" stopColor="var(--ink-1)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--ink-1)" stopOpacity="1" />
        </linearGradient>
        <filter id={filterGlow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={size * (score >= 75 ? 0.028 : 0.018)} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* inactive backing arc */}
      <path d={arcPath(startA, endA, r)}
        fill="none" stroke={`url(#${gradInactive})`}
        strokeWidth={arcWidth} strokeLinecap="round" />

      {/* active arc */}
      {score > 0.5 && (
        <path d={arcPath(startA, valueA, r)}
          fill="none" stroke={`url(#${gradActive})`}
          strokeWidth={arcWidth} strokeLinecap="round" />
      )}

      {/* scale labels */}
      {majors.map((m) => {
        const inset = m === 0 ? 2.5 : m === 100 ? -2.5 : 0;
        const a = startA + (m / 100) * (endA - startA) + inset;
        const [lx, ly] = polar(a, r);
        const reached = score >= m;
        return (
          <text key={m} x={lx} y={ly}
            transform={`rotate(${a + 90} ${lx} ${ly})`}
            fill={reached ? 'var(--bg)' : 'var(--ink-1)'}
            opacity={reached ? 0.95 : 0.5}
            fontSize={size * 0.058} fontWeight="700"
            fontFamily="'Barlow Condensed', 'Inter', sans-serif"
            textAnchor="middle" dominantBaseline="middle"
            style={{ letterSpacing: '0.02em' }}>{m}</text>
        );
      })}

      {/* needle */}
      {(() => {
        const len = r - arcWidth * 0.95;
        const baseW = size * 0.025;
        const tipW = size * 0.014;
        const a = (valueA * Math.PI) / 180;
        const perp = a + Math.PI / 2;
        const [tx, ty] = [cx + len * Math.cos(a), cy + len * Math.sin(a)];
        const [b1x, b1y] = [cx + baseW * Math.cos(perp), cy + baseW * Math.sin(perp)];
        const [b2x, b2y] = [cx - baseW * Math.cos(perp), cy - baseW * Math.sin(perp)];
        const [t1x, t1y] = [tx + tipW * Math.cos(perp), ty + tipW * Math.sin(perp)];
        const [t2x, t2y] = [tx - tipW * Math.cos(perp), ty - tipW * Math.sin(perp)];
        return (
          <g filter={`url(#${filterGlow})`}>
            <path d={`M ${b1x} ${b1y} L ${t1x} ${t1y} L ${t2x} ${t2y} L ${b2x} ${b2y} Z`}
              fill={`url(#${gradNeedle})`} strokeLinejoin="round" />
          </g>
        );
      })()}

      {/* score readout */}
      <text x={cx} y={cy + size * 0.30}
        fill={tone}
        fontSize={size * 0.22} fontWeight="200"
        fontFamily="'Barlow Condensed', 'Inter', sans-serif"
        textAnchor="middle"
        style={{ letterSpacing: '0.01em', filter: score >= 75 ? `drop-shadow(0 0 ${size * 0.04}px ${tone})` : 'none' }}>
        {score}
      </text>
      <text x={cx} y={cy + size * 0.355}
        fill={tone} fontSize={size * 0.032} fontWeight="600"
        letterSpacing="0.24em"
        fontFamily="var(--font-mono)" textAnchor="middle">
        {tier.tier} · {tier.verb}
      </text>
    </svg>
  );
}
