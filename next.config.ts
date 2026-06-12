import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray lockfile in a parent
  // directory doesn't get inferred as the root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
