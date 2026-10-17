import type { NextConfig } from 'next';

const apiOrigin = (process.env.FIELDOPS_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
