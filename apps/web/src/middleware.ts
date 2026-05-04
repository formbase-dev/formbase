import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import { verifyRequestOrigin } from './lib/verify-request';

const authEntryPaths = new Set(['/login', '/signup']);

export function middleware(request: NextRequest): NextResponse {
  if (request.method === 'GET') {
    if (
      process.env['ALLOW_SIGNIN_SIGNUP'] === 'false' &&
      authEntryPaths.has(request.nextUrl.pathname)
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  const originHeader = request.headers.get('Origin');
  const hostHeader = request.headers.get('Host');
  const path = request.nextUrl.pathname;
  const submissionMatch = /^\/s\/([a-zA-Z0-9_-]+)$/.exec(path);

  if (submissionMatch?.[1]) {
    return NextResponse.rewrite(
      new URL(`/api/s/${submissionMatch[1]}`, request.url),
    );
  }

  if (
    !originHeader ||
    !hostHeader ||
    !verifyRequestOrigin(originHeader, [hostHeader])
  ) {
    return new NextResponse(null, {
      status: 403,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|static|.*\\..*|_next|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
