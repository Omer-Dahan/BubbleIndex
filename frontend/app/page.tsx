import AppClient from './AppClient';
import { api } from '@/lib/api';

export const revalidate = 86400; // 24 hours in seconds

export default async function Page() {
  // Fetch data on the server with revalidation caching options passed explicitly
  const score = await api.getLatestScore({ next: { revalidate: 86400 } })
    .catch(() => api.getRiskScore({ next: { revalidate: 86400 } }))
    .catch(() => null);

  const snapshots = await api.getAllSnapshots({ next: { revalidate: 86400 } })
    .catch(() => api.getSnapshots(730, { next: { revalidate: 86400 } }))
    .catch(() => []);

  return <AppClient initialData={score} initialSnapshots={snapshots} />;
}
