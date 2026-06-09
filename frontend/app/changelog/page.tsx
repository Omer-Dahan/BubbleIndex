import type { Metadata } from 'next';
import ScreenChangelog from '@/components/ScreenChangelog';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Changelog';
const description = 'Keep track of updates, release notes, and improvements to the BubbleIndex platform.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/changelog` },
  openGraph: { title, description, url: `${BASE_URL}/changelog`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenChangelog} />;
}
