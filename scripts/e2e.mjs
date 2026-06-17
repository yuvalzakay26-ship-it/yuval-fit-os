// e2e runner: build once with the testing gate seam baked in, then run Playwright.
//
// The Playwright harness serves the production build with `next start` (two
// read-only servers on :3939/:3940 — see playwright.config.ts). Unlike `next dev`,
// `next start` inlines NEXT_PUBLIC_* vars at BUILD time, so the beta-gate bypass
// (`NEXT_PUBLIC_BETA_DISABLE_GATE=1`, a documented testing-only seam) must be set
// for the build, not just on the servers. Server-only seams like NUTRITION_AI_MOCK
// stay per-server in the config (read at request time via the force-dynamic page).
import { spawnSync } from "node:child_process";

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Main build (.next) — gate BYPASSED so the suite can reach app surfaces without
// a live Supabase project. Served on :3939 / :3940 (see playwright.config.ts).
run("next", ["build"], { NEXT_PUBLIC_BETA_DISABLE_GATE: "1" });

// Auth-entry build (.next-auth) — gate ENABLED + dummy Supabase config so the
// real sign-in screen renders (no network: getSession() reads local storage and
// resolves to "signed out"). Served on :3941 for e2e/auth-entry.spec.ts. The
// dummy URL/key are syntactically valid placeholders, never real credentials.
run("next", ["build"], {
  NEXT_DIST_DIR: ".next-auth",
  NEXT_PUBLIC_SUPABASE_URL: "https://e2e-dummy.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-dummy-anon-key",
});

run("playwright", ["test"], {});
