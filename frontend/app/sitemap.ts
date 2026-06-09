import type { MetadataRoute } from 'next';
import { CATEGORY_IDS } from '@/lib/methodology-data';
import { BASE_URL } from '@/lib/seo';

const STATIC_ROUTES = [
  '',
  '/historical',
  '/indicators',
  '/replay',
  '/ai',
  '/methodology',
  '/about',
  '/contact',
  '/privacy',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1.0 : 0.7,
  }));

  const categoryEntries = CATEGORY_IDS.map((id) => ({
    url: `${BASE_URL}/methodology/${id}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries];
}
