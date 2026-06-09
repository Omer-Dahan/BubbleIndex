import type { RiskScoreResponse, SnapshotSummary } from './types';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch<T>(path: string, init?: RequestInit & { next?: { revalidate?: number | false } }): Promise<T> {
  const { next, ...rest } = init || {};
  const res = await fetch(`${BACKEND}${path}`, {
    ...rest,
    next: next !== undefined ? next : { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  getRiskScore: (init?: any) => apiFetch<RiskScoreResponse>('/api/v1/risk-score/current', init),
  getLatestScore: (init?: any) => apiFetch<RiskScoreResponse>('/api/v1/risk-score/latest', init),
  refreshScore: () => apiFetch<RiskScoreResponse>('/api/v1/risk-score/refresh', { method: 'POST' }),
  getSnapshots: (days = 365, init?: any) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    return apiFetch<SnapshotSummary[]>(`/api/v1/history/snapshots?start_date=${start}&end_date=${end}`, init);
  },
  getAllSnapshots: (init?: any) => {
    const end = new Date().toISOString().split('T')[0];
    return apiFetch<SnapshotSummary[]>(`/api/v1/history/snapshots?start_date=1990-01-01&end_date=${end}`, init);
  },
  getSnapshotByDate: (dateStr: string, init?: any) =>
    apiFetch<SnapshotSummary>(`/api/v1/history/snapshots/${dateStr}`, init),
  getCrisisProfiles: (init?: any) => apiFetch<any[]>('/api/v1/crisis/profiles', init),
  getHealth: () => apiFetch<{ status: string; ready: boolean }>('/health'),
};
