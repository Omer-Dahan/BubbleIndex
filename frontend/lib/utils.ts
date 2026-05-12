export function riskTier(score: number) {
  if (score < 20) return { tier: 'LOW',      tone: 'var(--t-2)', verb: 'BUY' };
  if (score < 40) return { tier: 'MODERATE', tone: 'var(--t-4)', verb: 'HOLD' };
  if (score < 60) return { tier: 'ELEVATED', tone: 'var(--t-5)', verb: 'WATCH' };
  if (score < 80) return { tier: 'HIGH',     tone: 'var(--t-7)', verb: 'CAUTION' };
  return              { tier: 'BUBBLE',      tone: 'var(--t-9)', verb: 'SELL' };
}

export function tempVar(score: number): string {
  const idx = Math.max(0, Math.min(9, Math.floor(score / 10)));
  return `var(--t-${idx})`;
}

export function scaleTone(score: number): string {
  const stops: [number, string][] = [
    [0.00, '--t-1'], [0.25, '--t-3'], [0.50, '--t-5'],
    [0.70, '--t-7'], [0.85, '--t-8'], [1.00, '--t-9'],
  ];
  const t = Math.max(0, Math.min(1, score / 100));
  let i = 0;
  while (i < stops.length - 1 && t > stops[i + 1][0]) i++;
  const [a, va] = stops[i];
  const [b, vb] = stops[Math.min(i + 1, stops.length - 1)];
  const f = b === a ? 0 : (t - a) / (b - a);
  return `color-mix(in oklab, var(${va}) ${Math.round((1 - f) * 100)}%, var(${vb}))`;
}

export function makeSeries(n: number, seed = 1, vol = 0.4, drift = 0.6): number[] {
  const out: number[] = [];
  let v = 0.5, s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < n; i++) {
    v += (rand() - 0.5) * vol + (drift - 0.5) * 0.02;
    v = Math.max(0.05, Math.min(0.95, v));
    out.push(v);
  }
  return out;
}
