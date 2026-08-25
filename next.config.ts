import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/ReBench",
  assetPrefix: "/ReBench/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
