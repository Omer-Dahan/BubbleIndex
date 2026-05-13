import type { RiskScoreResponse, SnapshotSummary } from './types';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    ...init,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  getRiskScore: () => apiFetch<RiskScoreResponse>('/api/v1/risk-score/current'),
  getLatestScore: () => apiFetch<RiskScoreResponse>('/api/v1/risk-score/latest'),
  refreshScore: () => apiFetch<RiskScoreResponse>('/api/v1/risk-score/refresh', { method: 'POST' }),
  getSnapshots: (days = 365) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    return apiFetch<SnapshotSummary[]>(`/api/v1/history/snapshots?start_date=${start}&end_date=${end}`);
  },
  getAllSnapshots: () => {
    const end = new Date().toISOString().split('T')[0];
    return apiFetch<SnapshotSummary[]>(`/api/v1/history/snapshots?start_date=1990-01-01&end_date=${end}`);
  },
  getSnapshotByDate: (dateStr: string) =>
    apiFetch<SnapshotSummary>(`/api/v1/history/snapshots/${dateStr}`),
  getCrisisProfiles: () => apiFetch<any[]>('/api/v1/crisis/profiles'),
};
