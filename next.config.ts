import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build output directory. Defaults to ".next"; the e2e harness overrides it
  // (NEXT_DIST_DIR=.next-auth) to produce a SECOND, gate-enabled build that can
  // be served beside the gate-bypassed one — that second build is what lets the
  // auth-entry spec render the real sign-in screen. See scripts/e2e.mjs.
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
