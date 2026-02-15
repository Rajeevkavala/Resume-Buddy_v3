/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Compress output for smaller bundles
  compress: true,
  
  // Turbopack config (Next.js 16 default)
  turbopack: {},
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize imports for large libraries (tree shaking)
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
      'recharts',
      'framer-motion',
      'date-fns',
      'lodash',
    ],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'user', // A placeholder, actual auth state is handled client-side
          },
        ],
      },
      {
        source: '/signup',
        destination: '/',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'user',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
