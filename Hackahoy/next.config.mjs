/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',

  // Public backgrounds receive Cache-Control: max-age=0 by default, which
  // forces browsers to revalidate them on every navigation. Rename a file when
  // its contents change so clients do not keep a stale background.
  async headers() {
    return [
      {
        source: '/assets/backgrounds/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
