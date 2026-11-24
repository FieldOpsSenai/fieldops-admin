import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.FIELDOPS_DEV_TARGET === "docker" ? { distDir: ".next/docker" } : {}),
};

export default nextConfig;
