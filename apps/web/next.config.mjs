import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',            // small self-contained server for Docker
  outputFileTracingRoot: root,     // monorepo: trace workspace packages too
  transpilePackages: ['@apex/core', '@apex/db', '@apex/sportmonks'],
  serverExternalPackages: ['pg'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: '/live', destination: '/cricket-live-score', permanent: true },
      { source: '/fixtures', destination: '/schedule', permanent: true },
      { source: '/teams', destination: '/team', permanent: true },
    ];
  },
};
export default nextConfig;
