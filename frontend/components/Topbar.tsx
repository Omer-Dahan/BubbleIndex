'use client';
import type { Palette } from '@/lib/types';

interface Props {
  active: string;
  palette: Palette;
  onCyclePalette: () => void;
  onNavigate: (screen: string) => void;
  onOpenTweaks?: () => void;
}

const NAV = [
  ['home', 'Home'],
  ['historical', 'Historical'],
  ['indicators', 'Indicators'],
  ['replay', 'Replay'],
  ['ai', 'AI Insights'],
  ['methodology', 'Methodology'],
] as const;

export default function Topbar({ active, palette, onCyclePalette, onNavigate, onOpenTweaks }: Props) {
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
        fontFamily: 'var(--font-mono)', fontSize: 15,
        letterSpacing: '0.08em', fontWeight: 500, color: 'var(--ink-1)',
        flexShrink: 0,
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
            fontSize: 14, color: id === active ? 'var(--ink-1)' : 'var(--ink-3)',
            padding: '7px 12px', borderRadius: 6, cursor: 'pointer', border: 'none',
            background: id === active ? 'var(--panel-3)' : 'transparent',
            fontFamily: 'var(--font-sans)',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1 }} />


      {/* Palette switcher */}
      <button onClick={onCyclePalette} title={`Palette · ${palette}`} style={{
        height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
        border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--panel-2)',
        color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 11,
        letterSpacing: '0.10em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0,
      }}>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          {(['var(--t-1)', 'var(--t-5)', 'var(--t-9)'] as string[]).map((c, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          ))}
        </span>
        {palette}
      </button>

      {/* Settings icon — opens Tweaks panel */}
      <button
        onClick={onOpenTweaks}
        title="Tweaks"
        style={{
          width: 34, height: 34, display: 'grid', placeItems: 'center',
          border: '1px solid var(--hairline)', background: 'var(--panel-2)',
          borderRadius: 8, color: 'var(--ink-2)', cursor: onOpenTweaks ? 'pointer' : 'default',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
        </svg>
      </button>
    </div>
  );
}
