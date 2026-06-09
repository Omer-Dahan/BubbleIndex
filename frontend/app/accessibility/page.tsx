import type { Metadata } from 'next';
import ScreenAccessibility from '@/components/ScreenAccessibility';
import ScreenWrapper from '@/components/ScreenWrapper';
import { BASE_URL } from '@/lib/seo';

const title = 'Accessibility Statement';
const description = 'Our commitment to ensuring digital accessibility for people with disabilities on BubbleIndex.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE_URL}/accessibility` },
  openGraph: { title, description, url: `${BASE_URL}/accessibility`, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function Page() {
  return <ScreenWrapper screen={ScreenAccessibility} />;
}
