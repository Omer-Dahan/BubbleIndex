import type { Metadata } from 'next';
import ScreenCookieSettings from '@/components/ScreenCookieSettings';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Cookie Settings';
const description = 'Manage your cookie preferences and control Google Analytics tracking on BubbleIndex.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/cookie-settings` },
  openGraph: { title, description, url: `${BASE_URL}/cookie-settings`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenCookieSettings} />;
}
