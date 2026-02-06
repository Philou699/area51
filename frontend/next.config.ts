import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure Turbopack uses this app folder as root
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'http://server:8080/:path*'  // En production Docker (communication entre containers)
          : 'http://localhost:8080/:path*',  // En développement local
      },
    ];
  },
};

export default nextConfig;
