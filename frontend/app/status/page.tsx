import type { Metadata } from 'next';
import ScreenStatus from '@/components/ScreenStatus';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'System Status';
const description = 'Live health and availability of the BubbleIndex API, scoring engine, and data feeds.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/status` },
  openGraph: { title, description, url: `${BASE_URL}/status`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenStatus} />;
}
