import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
  experimental: {},
  allowedDevOrigins: [
    "192.168.1.9",
    "http://192.168.1.9:3000",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
  ],
};

export default nextConfig;