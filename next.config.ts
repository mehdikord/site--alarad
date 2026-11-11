import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  images: {
    formats: ['image/webp'],
    qualities: [60, 70, 75, 80, 82, 88],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1600],
    imageSizes: [96, 160, 240, 320, 480],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
