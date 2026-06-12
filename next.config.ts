import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray lockfile in a parent
  // directory doesn't get inferred as the root.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Exercise + food media are served through next/image; lock the optimizer
    // endpoint to those folders (Next 16 localPatterns guardrail).
    localPatterns: [
      {
        pathname: "/exercises/**",
        search: "",
      },
      {
        pathname: "/food/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
