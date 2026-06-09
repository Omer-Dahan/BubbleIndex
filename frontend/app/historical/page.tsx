import type { Metadata } from 'next';
import ScreenHistorical from '@/components/ScreenHistorical';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Historical Risk Data';
const description = 'Explore 125 years of market history: composite risk scores, crisis markers, and drawdown context across every major bubble and crash.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/historical` },
  openGraph: { title, description, url: `${BASE_URL}/historical`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenHistorical} />;
}
