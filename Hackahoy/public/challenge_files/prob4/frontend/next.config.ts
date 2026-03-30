const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://radio-backend-prod:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;