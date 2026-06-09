// Shared SEO constants — single source of truth for the production site URL,
// consumed by the root layout, per-route generateMetadata, sitemap.ts, and robots.ts.

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
