import type { Metadata } from 'next';
import ScreenMethodology from '@/components/ScreenMethodology';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Methodology';
const description = 'How the BubbleIndex composite risk score is built. Explore the five categories (Valuation, Macro Stress, Leverage & Credit, Sentiment, Concentration) and the indicators behind each.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/methodology` },
  openGraph: { title, description, url: `${BASE_URL}/methodology`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenMethodology} />;
}
