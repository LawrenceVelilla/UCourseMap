/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // Add API proxy to backend
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*' // Adjust port if needed
      }
    ];
  }
};

module.exports = nextConfig;