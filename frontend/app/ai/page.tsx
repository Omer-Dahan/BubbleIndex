import type { Metadata } from 'next';
import ScreenAI from '@/components/ScreenAI';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'AI Insights';
const description = 'AI-generated commentary on the current risk landscape: automated analysis of the composite score and the categories driving it.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/ai` },
  openGraph: { title, description, url: `${BASE_URL}/ai`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenAI} />;
}
