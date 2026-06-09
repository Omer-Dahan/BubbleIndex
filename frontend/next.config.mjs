/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
