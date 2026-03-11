import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9999",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9999",
      },
      {
        protocol: "http",
        hostname: "0.0.0.0",
        port: "9999",
      },
      {
        protocol: "http",
        hostname: "192.168.100.25",
        port: "9999",
      },
      {
        protocol: "https",
        hostname: "*.trycloudflare.com",
      },
    ],
  },
};

export default nextConfig;
