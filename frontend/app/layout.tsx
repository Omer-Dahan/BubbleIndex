import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter, Barlow_Condensed } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { api } from '@/lib/api';
import { LanguageProvider } from '@/lib/LanguageContext';
import AppShell from '@/components/AppShell';
import { JsonLd } from '@/components/JsonLd';
import { BASE_URL } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['200', '300', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
  display: 'swap',
});

export const revalidate = 86400; // 24 hours in seconds

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'BubbleIndex | Market Risk Monitor',
    template: '%s | BubbleIndex',
  },
  description: 'Systemic market risk visualization platform, scored against 125 years of bubble history.',
  alternates: { canonical: '/' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? '';

  // Fetch shared shell data on the server with revalidation caching options passed explicitly
  const score = await api.getLatestScore({ next: { revalidate: 86400 } })
    .catch(() => api.getRiskScore({ next: { revalidate: 86400 } }))
    .catch(() => null);

  const snapshots = await api.getAllSnapshots({ next: { revalidate: 86400 } })
    .catch(() => api.getSnapshots(730, { next: { revalidate: 86400 } }))
    .catch(() => []);

  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable} ${geistMono.variable}`}>
      <body>
        <JsonLd
          nonce={nonce}
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'BubbleIndex',
            url: BASE_URL,
          }}
        />
        <JsonLd
          nonce={nonce}
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'BubbleIndex',
            url: BASE_URL,
          }}
        />
        <LanguageProvider>
          <AppShell initialData={score} initialSnapshots={snapshots}>
            {children}
          </AppShell>
        </LanguageProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
