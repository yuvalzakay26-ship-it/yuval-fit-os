import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Gate-enabled e2e build output (scripts/e2e.mjs builds into .next-auth via
    // NEXT_DIST_DIR). Generated/minified, gitignored, not source — same as .next.
    ".next-auth/**",
  ]),
]);

export default eslintConfig;
