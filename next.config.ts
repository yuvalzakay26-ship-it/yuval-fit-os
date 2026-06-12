import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray lockfile in a parent
  // directory doesn't get inferred as the root.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Exercise media is the only thing served through next/image; lock the
    // optimizer endpoint to it (Next 16 localPatterns guardrail).
    localPatterns: [
      {
        pathname: "/exercises/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
