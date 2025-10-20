/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@radix-ui/react-progress'],
  images: { unoptimized: true },
  trailingSlash: true,
  // exportPathMap: async function (
  //   defaultPathMap,
  //   { dev, dir, outDir, distDir, buildId }
  // ) {
  //   return {
  //     '/': { page: '/' },
  //     '/login': { page: '/login' },
  //     '/signup': { page: '/signup' },
  //     '/dashboard': { page: '/dashboard' },
  //     '/dashboard/consents': { page: '/dashboard/consents' },
  //     '/dashboard/consents/new': { page: '/dashboard/consents/new' },
  //     '/dashboard/upload': { page: '/dashboard/upload' },
  //     '/dashboard/showcase-ready': { page: '/dashboard/showcase-ready' },
  //     '/dashboard/showcase': { page: '/dashboard/showcase' },
  //     '/dashboard/content-library': { page: '/dashboard/content-library' },
  //     '/dashboard/review-settings': { page: '/dashboard/review-settings' },
  //     '/share': { page: '/share' }, // Static route instead of dynamic
  //   };
  // },
};

module.exports = nextConfig;