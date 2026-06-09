import type { Metadata } from 'next';
import { headers } from 'next/headers';
import ScreenMethodologyDetail from '@/components/ScreenMethodologyDetail';
import ScreenWrapper from '@/components/ScreenWrapper';
import { JsonLd } from '@/components/JsonLd';
import { CATEGORY_IDS, DETAILS } from '@/lib/methodology-data';
import { BASE_URL } from '@/lib/seo';

export function generateStaticParams() {
  return CATEGORY_IDS.map((category) => ({ category }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const detail = DETAILS[params.category];
  if (!detail) {
    return { title: 'Methodology', alternates: { canonical: `${BASE_URL}/methodology/${params.category}` } };
  }

  const title = `${detail.display_name} | Methodology`;
  const description = detail.tagline;
  const url = `${BASE_URL}/methodology/${detail.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }: { params: { category: string } }) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  const detail = DETAILS[params.category];

  return (
    <>
      {detail && (
        <JsonLd
          nonce={nonce}
          data={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
              { '@type': 'ListItem', position: 2, name: 'Methodology', item: `${BASE_URL}/methodology` },
              { '@type': 'ListItem', position: 3, name: detail.display_name, item: `${BASE_URL}/methodology/${detail.id}` },
            ],
          }}
        />
      )}
      <ScreenWrapper screen={ScreenMethodologyDetail} category={params.category} />
    </>
  );
}
