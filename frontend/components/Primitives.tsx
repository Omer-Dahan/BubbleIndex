'use client';
import { riskTier, tempVar } from '@/lib/utils';

// Sparkline
export function Sparkline({ data, w = 220, h = 56, stroke = 'var(--ink-2)', fill = true, fluid = false, yMin, yMax }: {
  data: number[]; w?: number; h?: number; stroke?: string; fill?: boolean; fluid?: boolean; yMin?: number; yMax?: number;
}) {
  if (!data.length) return null;
  const min = yMin !== undefined ? yMin : Math.min(...data);
  const max = yMax !== undefined ? yMax : Math.max(...data);
  const range = max - min || 1;
  const vw = 220;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * vw,
    h - ((v - min) / range) * (h - 6) - 3,
  ] as [number, number]);
  const d = pts.map(([x, y], i) => (i ? `L${x.toFixed(1)} ${y.toFixed(1)}` : `M${x.toFixed(1)} ${y.toFixed(1)}`)).join(' ');
  const area = `${d} L ${vw} ${h} L 0 ${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${vw} ${h}`}
      width={fluid ? '100%' : w}
      height={h}
      preserveAspectRatio="none"
      style={fluid ? { display: 'block' } : undefined}
    >
      {fill && <path d={area} fill={stroke} opacity="0.08" />}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Radar chart
export function Radar({ axes, values, size = 260 }: { axes: string[]; values: number[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (v: number, i: number): [number, number] => [
    cx + Math.cos(angle(i)) * r * v,
    cy + Math.sin(angle(i)) * r * v,
  ];
  const polyPts = values.map((v, i) => point(v, i)).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f}
          points={axes.map((_, i) => point(f, i)).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
          fill="none" stroke="var(--hairline)" strokeDasharray={f === 1 ? '0' : '2 4'} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(1, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hairline)" />;
      })}
      <polygon points={polyPts} fill="var(--t-7)" fillOpacity="0.18" stroke="var(--t-7)" strokeWidth="1.5" />
      {axes.map((ax, i) => {
        const [x, y] = point(1.22, i);
        return <text key={ax} x={x} y={y} fontSize="11" fontFamily="var(--font-mono)"
          fill="var(--ink-2)" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.06em">
          {ax.toUpperCase()}
        </text>;
      })}
      {values.map((v, i) => {
        const [x, y] = point(v, i);
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--t-7)" />;
      })}
    </svg>
  );
}

// Heat cell — value shown only in tooltip, not inside the cell
export function HeatCell({ value, tooltip }: { value: number; tooltip?: string }) {
  const score = Math.round(value * 100);
  return (
    <div className="bi-hoverable" style={{
      aspectRatio: '1 / 1', borderRadius: 4, background: tempVar(score),
      opacity: 0.88, display: 'block',
    }} title={tooltip} />
  );
}

// Delta tag
export function Delta({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={'mono tnum'} style={{ fontSize: 11, fontWeight: 600, color: up ? 'var(--t-9)' : 'var(--t-3)' }}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

// Verdict pill
export function VerdictPill({ score }: { score: number }) {
  const t = riskTier(score);
  return (
    <span className="bi-verdict" style={{
      color: t.tone,
      background: `color-mix(in srgb, ${t.tone} 12%, transparent)`,
      border: `1px solid color-mix(in srgb, ${t.tone} 35%, transparent)`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 12px currentColor', display: 'inline-block' }} />
      {t.verb}
    </span>
  );
}
