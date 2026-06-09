import type { Metadata } from 'next';
import ScreenTerms from '@/components/ScreenTerms';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Terms of Use';
const description = 'Terms and conditions for accessing and using the BubbleIndex platform and its market risk indicators.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/terms` },
  openGraph: { title, description, url: `${BASE_URL}/terms`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenTerms} />;
}
