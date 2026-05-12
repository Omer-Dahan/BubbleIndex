'use client';
import type { Palette } from '@/lib/types';

interface Props {
  active: string;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (screen: string) => void;
}

const NAV = [
  ['home', 'Home'],
  ['historical', 'Historical'],
  ['indicators', 'Indicators'],
  ['replay', 'Replay'],
  ['ai', 'AI Insights'],
] as const;

export default function Topbar({ active, palette, onCyclePalette, onNavigate }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24,
      padding: '16px var(--pad-screen)',
      borderBottom: '1px solid var(--hairline)',
      background: 'var(--panel)', flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-mono)', fontSize: 13,
        letterSpacing: '0.08em', fontWeight: 500, color: 'var(--ink-1)',
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: 2,
          background: 'linear-gradient(135deg, var(--t-2), var(--t-8))',
          display: 'inline-block',
        }} />
        BUBBLEINDEX
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
        {NAV.map(([id, label]) => (
          <button key={id} onClick={() => onNavigate(id)} style={{
            fontSize: 13, color: id === active ? 'var(--ink-1)' : 'var(--ink-3)',
            padding: '6px 10px', borderRadius: 6, cursor: 'pointer', border: 'none',
            background: id === active ? 'var(--panel-3)' : 'transparent',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{
        width: 280, height: 32, border: '1px solid var(--hairline)', borderRadius: 8,
        background: 'var(--panel-2)', display: 'flex', alignItems: 'center',
        padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 12,
        color: 'var(--ink-4)', gap: 8,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
        </svg>
        Search ticker, index, era…
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--panel-3)', color: 'var(--ink-3)', border: '1px solid var(--hairline)' }}>⌘K</span>
      </div>

      {/* Palette switcher */}
      <button onClick={onCyclePalette} title={`Palette · ${palette}`} style={{
        height: 32, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6,
        border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)',
        color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
      }}>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          {(['var(--t-1)', 'var(--t-5)', 'var(--t-9)'] as string[]).map((c, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          ))}
        </span>
        {palette}
      </button>

      {/* Settings icon */}
      <div style={{
        width: 32, height: 32, display: 'grid', placeItems: 'center',
        border: '1px solid var(--hairline)', background: 'var(--panel-2)',
        borderRadius: 8, color: 'var(--ink-2)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
        </svg>
      </div>

      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--panel-3)', border: '1px solid var(--hairline)' }} />
    </div>
  );
}
