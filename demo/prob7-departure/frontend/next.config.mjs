/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.PROB7_BACKEND_URL || 'http://127.0.0.1:4002'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
