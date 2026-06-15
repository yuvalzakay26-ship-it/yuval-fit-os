// e2e runner: build once with the testing gate seam baked in, then run Playwright.
//
// The Playwright harness serves the production build with `next start` (two
// read-only servers on :3939/:3940 — see playwright.config.ts). Unlike `next dev`,
// `next start` inlines NEXT_PUBLIC_* vars at BUILD time, so the beta-gate bypass
// (`NEXT_PUBLIC_BETA_DISABLE_GATE=1`, a documented testing-only seam) must be set
// for the build, not just on the servers. Server-only seams like NUTRITION_AI_MOCK
// stay per-server in the config (read at request time via the force-dynamic page).
import { spawnSync } from "node:child_process";

const env = { ...process.env, NEXT_PUBLIC_BETA_DISABLE_GATE: "1" };

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env, shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("next", ["build"]);
run("playwright", ["test"]);
