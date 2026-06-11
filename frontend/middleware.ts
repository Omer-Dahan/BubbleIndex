import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // The /backend rewrite proxies to the API server from the Next server itself,
  // bypassing any IP allowlist on the backend — restrict it to read-only requests.
  if (request.nextUrl.pathname.startsWith('/backend/') && request.method !== 'GET') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const apiOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  // Next.js dev mode (Fast Refresh / webpack eval-source-map) requires 'unsafe-eval' to execute
  // client modules — production builds don't use eval, so this stays dev-only.
  const isDev = process.env.NODE_ENV !== 'production';

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://www.google.com https://*.google.com",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin} https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com https://*.google.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
