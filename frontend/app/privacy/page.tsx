import type { Metadata } from 'next';
import ScreenPrivacy from '@/components/ScreenPrivacy';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Privacy Policy';
const description = 'How BubbleIndex collects, uses, and protects your data, including details on cookies and analytics.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/privacy` },
  openGraph: { title, description, url: `${BASE_URL}/privacy`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenPrivacy} />;
}
