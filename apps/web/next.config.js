import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : null;

const appImageRemotePatterns = appUrl
  ? [
      {
        protocol: appUrl.protocol.replace(':', ''),
        hostname: appUrl.hostname,
        port: appUrl.port,
        pathname: '/api/files/**',
      },
    ]
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      ...appImageRemotePatterns,
    ],
  },
  transpilePackages: [
    '@formbase/api',
    '@formbase/auth',
    '@formbase/db',
    '@formbase/env',
    '@formbase/ui',
    '@formbase/utils',
    '@formbase/tailwind',
  ],
  serverExternalPackages: [
    'libsql',
    '@libsql/client',
    '@libsql/isomorphic-fetch',
    '@libsql/isomorphic-ws',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
