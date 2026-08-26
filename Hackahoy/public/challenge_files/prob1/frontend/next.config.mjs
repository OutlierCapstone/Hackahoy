/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.PROB1_BACKEND_URL || 'http://localhost:4001'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
