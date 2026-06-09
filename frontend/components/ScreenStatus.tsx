'use client';
import { useState, useEffect } from 'react';
import Topbar from './Topbar';
import LayoutWithBubbles from './LayoutWithBubbles';
import type { RiskScoreResponse, Palette } from '@/lib/types';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

interface Props {
  data: RiskScoreResponse | null;
  palette: Palette;
  onCyclePalette: () => void;
  onOpenTweaks?: () => void;
}

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'checking';

const STATUS_COLOR: Record<ServiceStatus, string> = {
  operational: 'var(--t-3)',
  degraded: 'var(--t-6)',
  down: 'var(--t-9)',
  checking: 'var(--ink-4)',
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  checking: 'Checking…',
};

function snapshotAge(snapshotDate: string | undefined): ServiceStatus {
  if (!snapshotDate) return 'down';
  const hours = (Date.now() - new Date(snapshotDate).getTime()) / 3_600_000;
  if (hours < 48) return 'operational';
  if (hours < 168) return 'degraded';
  return 'down';
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default function ScreenStatus({ data, palette, onCyclePalette, onOpenTweaks }: Props) {
  const { isRtl } = useLanguage();
  const [apiStatus, setApiStatus] = useState<ServiceStatus>('checking');
  const [engineReady, setEngineReady] = useState<boolean | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    api.getHealth()
      .then(h => {
        setApiStatus(h.ready ? 'operational' : 'degraded');
        setEngineReady(h.ready);
      })
      .catch(() => {
        setApiStatus('down');
        setEngineReady(false);
      })
      .finally(() => setCheckedAt(new Date().toLocaleTimeString()));
  }, []);

  const engineStatus: ServiceStatus =
    apiStatus === 'checking' ? 'checking' :
    apiStatus === 'down' ? 'down' :
    engineReady ? 'operational' : 'degraded';

  const dataStatus = snapshotAge(data?.snapshot_date);

  const overallStatus: ServiceStatus =
    [apiStatus, engineStatus, dataStatus].includes('down') ? 'down' :
    [apiStatus, engineStatus, dataStatus].includes('degraded') ? 'degraded' :
    [apiStatus, engineStatus, dataStatus].includes('checking') ? 'checking' :
    'operational';

  const overallLabel =
    overallStatus === 'operational' ? 'All systems operational' :
    overallStatus === 'degraded'    ? 'Partial degradation' :
    overallStatus === 'down'        ? 'Service disruption' :
    'Checking systems…';

  const services: { name: string; description: string; status: ServiceStatus }[] = [
    {
      name: 'API',
      description: 'REST endpoints and data delivery',
      status: apiStatus,
    },
    {
      name: 'Scoring Engine',
      description: 'Risk score computation model',
      status: engineStatus,
    },
    {
      name: 'Data Feed',
      description: data?.snapshot_date
        ? `Last snapshot: ${data.snapshot_date}`
        : 'No snapshot data available',
      status: dataStatus,
    },
  ];

  const freshness = data?.data_freshness ? Object.entries(data.data_freshness) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Topbar palette={palette} onCyclePalette={onCyclePalette} onOpenTweaks={onOpenTweaks} />

      <div style={{ flex: 1, padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-grid)' }}>
        <LayoutWithBubbles>
          {/* Header */}
          <div>
            <div className="bi-eyebrow">SYSTEM STATUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-start' }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: STATUS_COLOR[overallStatus],
                boxShadow: overallStatus === 'operational'
                  ? `0 0 10px ${STATUS_COLOR[overallStatus]}`
                  : 'none',
                display: 'inline-block',
                animation: overallStatus === 'checking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }} />
              <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', margin: 0 }}>
                {overallLabel}
              </h1>
            </div>
            {checkedAt && (
              <p className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 8, letterSpacing: '0.04em', textAlign: isRtl ? 'right' : 'left' }}>
                Last checked {checkedAt}
              </p>
            )}
          </div>

        {/* Services */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map(svc => (
            <div key={svc.name} className="bi-card" style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-1)' }}>{svc.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{svc.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                  background: STATUS_COLOR[svc.status],
                  boxShadow: svc.status === 'operational'
                    ? `0 0 6px ${STATUS_COLOR[svc.status]}`
                    : 'none',
                  animation: svc.status === 'checking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }} />
                <span className="mono" style={{
                  fontSize: 11, letterSpacing: '0.06em',
                  color: STATUS_COLOR[svc.status],
                }}>
                  {STATUS_LABEL[svc.status]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Data freshness */}
        {freshness.length > 0 && (
          <div>
            <div className="bi-eyebrow" style={{ marginBottom: 10 }}>DATA FRESHNESS</div>
            <div className="bi-card" style={{ padding: 0, overflow: 'hidden' }}>
              {freshness.map(([key, date], i) => (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 18px',
                  borderBottom: i < freshness.length - 1 ? '1px solid var(--hairline)' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{key}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                      {formatRelative(date)}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-5)', letterSpacing: '0.04em' }}>
                      {date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        </LayoutWithBubbles>
      </div>
    </div>
  );
}
