import type { Metadata } from 'next';
import ScreenReplay from '@/components/ScreenReplay';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Crisis Replay';
const description = 'Step through past market crises year by year to see how the composite risk score and headlines evolved before, during, and after each crash.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/replay` },
  openGraph: { title, description, url: `${BASE_URL}/replay`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenReplay} />;
}
