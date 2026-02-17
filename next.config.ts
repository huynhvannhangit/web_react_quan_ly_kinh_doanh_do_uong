import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9999",
        pathname: "/public/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9999",
        pathname: "/public/uploads/**",
      },
    ],
  },
};

export default nextConfig;
