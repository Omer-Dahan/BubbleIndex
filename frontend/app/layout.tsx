import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'BubbleIndex — Market Risk Monitor',
  description: 'Systemic market risk visualization platform — scored against 125 years of bubble history.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
