import { type MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { absoluteUrl } from '@formbase/utils/server';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');

  if (!host) {
    throw new Error('Host header is required to build robots URLs');
  }

  const protocol =
    headersList.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.')
      ? 'http'
      : 'https');
  const origin = `${protocol}://${host}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: absoluteUrl('/sitemap.xml', origin),
  };
}
