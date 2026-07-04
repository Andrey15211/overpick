import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP:
      process.env.NODE_ENV === 'development' || process.env.OVERPICK_ALLOW_LOCAL_IMAGE_IP === '1',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd15f34w2p8l1cc.cloudfront.net',
        pathname: '/overwatch/**',
      },
      {
        protocol: 'https',
        hostname: 'blz-contentstack-images.akamaized.net',
        pathname: '/v3/assets/**',
      },
    ],
  },
};

export default nextConfig;
