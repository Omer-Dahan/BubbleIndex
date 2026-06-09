import type { Metadata } from 'next';
import ScreenIndicators from '@/components/ScreenIndicators';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Risk Indicators';
const description = 'A live breakdown of every indicator behind the composite risk score: valuation, macro stress, leverage & credit, sentiment, and concentration.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/indicators` },
  openGraph: { title, description, url: `${BASE_URL}/indicators`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenIndicators} />;
}
