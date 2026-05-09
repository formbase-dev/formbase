import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

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
