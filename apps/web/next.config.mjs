/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@apex/core'],
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/live', destination: '/cricket-live-score', permanent: true },
      { source: '/fixtures', destination: '/schedule', permanent: true },
      { source: '/teams', destination: '/team', permanent: true },
    ];
  },
};
export default nextConfig;
