import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BubbleIndex — Market Risk Monitor',
  description: 'Systemic market risk visualization platform — scored against 125 years of bubble history.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
