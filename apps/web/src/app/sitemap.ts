import { type MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { absoluteUrl } from '@formbase/utils/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');

  if (!host) {
    throw new Error('Host header is required to build sitemap URLs');
  }

  const protocol =
    headersList.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.')
      ? 'http'
      : 'https');
  const origin = `${protocol}://${host}`;
  const routes = ['/', '/dashboard'].map((route) => ({
    url: absoluteUrl(route, origin),
    lastModified: new Date().toISOString(),
  }));

  return [...routes];
}
