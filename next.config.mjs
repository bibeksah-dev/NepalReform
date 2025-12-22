import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better hydration debugging
  reactStrictMode: true,
  // Disable production source maps to prevent exposing source code (use error tracking service instead)
  productionBrowserSourceMaps: false,
  // Use default server output to avoid Windows symlink issues during standalone tracing

  // Next.js 16: ESLint config moved to CLI, TypeScript errors handled separately
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // Next.js 16: Turbopack config with root set for Windows compatibility
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      'recharts/es6': 'recharts/lib',
    },
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nepalreforms.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'nokrhvgrfcletinhsalt.supabase.co',
      }
    ],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  experimental: {
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'date-fns',
      'framer-motion',
      '@tanstack/react-query',
    ],
  },
  
  // Webpack config removed - using Turbopack in Next.js 16
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://nepalreforms.com',
  },

  async headers() {
    const isProd = process.env.NODE_ENV === 'production'

    // Build a safer CSP. Keep 'unsafe-eval' only in development to avoid breaking Next dev tools.
    const scriptSrc = isProd
      ? "'self' 'unsafe-inline'"
      : "'self' 'unsafe-inline' 'unsafe-eval'"

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      // Allow Supabase and websockets
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
      // Allow embedding internal widgets if needed
      "frame-src 'self' https://chat.nepalreforms.com https://*.nepalreforms.com",
      // Prefer HTTPS resources
      'upgrade-insecure-requests',
    ].join('; ')

    // Minimal, privacy-first Permissions-Policy
    const permissionsPolicy = [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=(self)',
      // Disable cohorting
      'interest-cohort=()'
    ].join(', ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: permissionsPolicy },
          // HSTS only in production (ignored on http://localhost)
          ...(isProd
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
