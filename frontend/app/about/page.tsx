import type { Metadata } from 'next';
import ScreenAbout from '@/components/ScreenAbout';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'About';
const description = 'Learn about BubbleIndex: a systemic market risk visualization platform scored against 125 years of bubble history.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: { title, description, url: `${BASE_URL}/about`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenAbout} />;
}
