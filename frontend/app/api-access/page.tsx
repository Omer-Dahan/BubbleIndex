import type { Metadata } from 'next';
import ScreenApiAccess from '@/components/ScreenApiAccess';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'API Access';
const description = 'Request API access keys to query BubbleIndex market risk scores and indicators.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/api-access` },
  openGraph: { title, description, url: `${BASE_URL}/api-access`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenApiAccess} />;
}
