import type { Metadata } from 'next';
import ScreenContact from '@/components/ScreenContact';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Contact';
const description = 'Get in touch with the BubbleIndex team for questions, feedback, and partnership inquiries.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: { title, description, url: `${BASE_URL}/contact`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenContact} />;
}
