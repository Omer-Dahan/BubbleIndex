'use client';
import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { riskTier, scaleTone } from '@/lib/utils';

interface Props { score: number; size?: number; }

function AnimatedScore({
  score, cx, cy, size, tone,
}: { score: number; cx: number; cy: number; size: number; tone: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.4,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [score]);

  return (
    <>
      <text
        x={cx} y={cy + size * 0.30}
        fill={tone}
        fontSize={size * 0.22} fontWeight="200"
        fontFamily="'Barlow Condensed', 'Inter', sans-serif"
        textAnchor="middle"
        style={{
          letterSpacing: '0.01em',
          filter: score >= 75 ? `drop-shadow(0 0 ${size * 0.04}px ${tone})` : 'none',
        }}
      >{display}</text>
    </>
  );
}

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
  const gradActive   = `grad-active-${uid}`;
  const gradInactive = `grad-inactive-${uid}`;
  const gradNeedle   = `grad-needle-${uid}`;
  const filterGlow   = `glow-${uid}`;

  const [gx1, gy1] = polar(startA, r);
  const [gx2, gy2] = polar(endA, r);
  const tone = scaleTone(score);

  // Needle geometry: drawn pointing right (+x) from (0,0), translated to center via SVG <g>
  const needleLen  = r - arcWidth * 0.95;
  const needleBase = size * 0.025;
  const needleTip  = size * 0.014;
  const needlePoints = `0,${-needleBase} ${needleLen},${-needleTip} ${needleLen},${needleTip} 0,${needleBase}`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <linearGradient id={gradActive} gradientUnits="userSpaceOnUse"
          x1={gx1} y1={gy1} x2={gx2} y2={gy2}>
          <stop offset="0"    stopColor="var(--t-1)" />
          <stop offset="0.25" stopColor="var(--t-3)" />
          <stop offset="0.50" stopColor="var(--t-5)" />
          <stop offset="0.70" stopColor="var(--t-7)" />
          <stop offset="0.85" stopColor="var(--t-8)" />
          <stop offset="1"    stopColor="var(--t-9)" />
        </linearGradient>
        <linearGradient id={gradInactive} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, var(--ink-1) 14%, var(--panel))" />
          <stop offset="1" stopColor="var(--panel-2)" />
        </linearGradient>
        {/* Gradient along needle pointing right from (0,0) in local translated space */}
        <linearGradient id={gradNeedle} gradientUnits="userSpaceOnUse"
          x1="0" y1="0" x2={needleLen} y2="0">
          <stop offset="0"    stopColor="var(--ink-1)" stopOpacity="0.2" />
          <stop offset="0.25" stopColor="var(--ink-1)" stopOpacity="0.65" />
          <stop offset="1"    stopColor="var(--ink-1)" stopOpacity="1" />
        </linearGradient>
        <filter id={filterGlow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={size * (score >= 75 ? 0.028 : 0.018)} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Inactive backing arc */}
      <path d={arcPath(startA, endA, r)}
        fill="none" stroke={`url(#${gradInactive})`}
        strokeWidth={arcWidth} strokeLinecap="round" />

      {/* Active arc — animates its length from 0 to score/100 */}
      <motion.path
        d={arcPath(startA, endA, r)}
        fill="none"
        stroke={`url(#${gradActive})`}
        strokeWidth={arcWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: score / 100, opacity: score > 0.5 ? 1 : 0 }}
        transition={{
          pathLength: { type: 'spring', stiffness: 48, damping: 20, restDelta: 0.001 },
          opacity:    { duration: 0.3 },
        }}
      />

      {/* Scale labels */}
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

      {/* Needle — SVG translate to center, then CSS rotate around local (0,0) */}
      <g transform={`translate(${cx} ${cy})`}>
        <motion.polygon
          points={needlePoints}
          fill={`url(#${gradNeedle})`}
          strokeLinejoin="round"
          style={{ originX: 0, originY: 0.5 }}
          initial={{ rotate: startA }}
          animate={{ rotate: valueA }}
          transition={{ type: 'spring', stiffness: 55, damping: 18 }}
          filter={`url(#${filterGlow})`}
        />
        {/* Hub circle at rotation center */}
        <circle r={size * 0.022} fill="var(--panel-3)" stroke="var(--ink-3)" strokeWidth="1.5" />
      </g>

      {/* Animated score readout */}
      <AnimatedScore score={score} cx={cx} cy={cy} size={size} tone={tone} />

      <text x={cx} y={cy + size * 0.355}
        fill={tone} fontSize={size * 0.032} fontWeight="600"
        letterSpacing="0.24em"
        fontFamily="var(--font-mono)" textAnchor="middle">
        {tier.tier} · {tier.verb}
      </text>
    </svg>
  );
}
