import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: false, // Disabled to prevent critters issues
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'framer-motion',
      'recharts'
    ],
    turbo: {
      resolveAlias: {
        canvas: './empty-module.js',
      },
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  },

  // Compression
  compress: true,
  poweredByHeader: false,

  // Environment variables
  env: {
    // Map Vercel's Supabase integration vars to NEXT_PUBLIC_ prefixed ones
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": __dirname,
    };

    // Add polyfill for 'self' in server-side builds
    if (isServer) {
      const webpack = require('webpack');
      
      // Define global variables for server builds
      config.plugins.push(
        new webpack.DefinePlugin({
          'typeof self': JSON.stringify('object'),
          'typeof window': JSON.stringify('object'),
          'typeof document': JSON.stringify('object'),
        })
      );
      
      // Add banner to define globals at runtime (only for server chunks, not middleware)
      config.plugins.push(
        new webpack.BannerPlugin({
          raw: true,
          entryOnly: false,
          test: /^(?!middleware).*\.js$/,
          banner: `
            if(typeof global !== 'undefined' && typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
              if(!global.self) global.self = global;
              if(!global.window) global.window = {
                addEventListener: () => {},
                removeEventListener: () => {},
                location: { href: '', origin: '', pathname: '' },
                requestAnimationFrame: (cb) => setTimeout(cb, 16),
              };
              if(!global.document) global.document = {
                querySelector: () => null,
                querySelectorAll: () => [],
                getElementById: () => null,
                getElementsByClassName: () => [],
                getElementsByTagName: () => [],
                createElement: () => ({}),
                createTextNode: () => ({}),
                addEventListener: () => {},
                removeEventListener: () => {},
                body: { appendChild: () => {}, removeChild: () => {} },
                head: { appendChild: () => {}, removeChild: () => {} },
              };
              if(!global.navigator) global.navigator = { userAgent: 'node' };
            }
          `,
        })
      );
    }

        // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
      };
    }

    // Fix 'self is not defined' error by excluding browser-specific dependencies from server bundle
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
      };

      // Alias browser-only dependencies to empty modules for server builds
      const browserDependencies = [
        '@solana/wallet-adapter-base',
        '@solana/wallet-adapter-react',
        '@solana/wallet-adapter-react-ui',
        '@solana/wallet-adapter-wallets',
        '@solana/web3.js',
        '@tanstack/react-virtual',
        'framer-motion',
        'embla-carousel-react',
        'recharts',
        'react-window',
        'react-virtualized-auto-sizer',
      ];

      // Create empty module for browser dependencies
      const path = require('path');
      const emptyModule = path.resolve(__dirname, './lib/empty-module.js');
      browserDependencies.forEach(dep => {
        config.resolve.alias[dep] = emptyModule;
      });
    }

    // Performance optimizations for production
    if (!dev && !isServer) {
      // Only apply chunk splitting for client builds
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix',
              chunks: 'all',
            },
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/logos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Export the config with Sentry wrapper
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  disableLogger: true,
  sourcemaps: {
    disable: true,
  },
});