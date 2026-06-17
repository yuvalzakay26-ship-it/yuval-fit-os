import { defineConfig, devices } from "@playwright/test";

// QA harness for Yuval Fit OS. The `test:e2e` script builds once, then two
// production servers (`next start`) run from that single build with different
// seams so we can exercise both photo-scan states from one suite:
//   :3939  NUTRITION_AI_MOCK=1  → AI enabled; scan card is active (mock draft).
//   :3940  (no AI env)          → AI disabled; scan card shows the "בקרוב" state.
// Two `next start` servers can safely share one build (read-only); only `next dev`
// takes a per-directory lock, which is why we don't run two dev servers here.
// Both bypass the beta access gate locally (NEXT_PUBLIC_BETA_DISABLE_GATE=1).
//
// Run:  npx playwright install chromium   (first time, downloads the browser)
//       npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    locale: "he-IL",
  },
  projects: [
    {
      // AI enabled (mock) — runs every spec except the disabled-state one and
      // the auth-entry spec (which needs the gate-ENABLED build on :3941).
      name: "mobile-390",
      testIgnore: /(nutrition-photo-disabled|auth-entry)\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
        baseURL: "http://localhost:3939",
      },
    },
    {
      // AI disabled (no key, no mock) — runs only the disabled-state spec.
      name: "no-ai-390",
      testMatch: /nutrition-photo-disabled\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
        baseURL: "http://localhost:3940",
      },
    },
    {
      // Auth entry screen — gate ENABLED build (:3941). Runs the auth-entry spec
      // at 360px (the narrow check for the no-clip / Google-only / locked-guest
      // login screen).
      name: "auth-360",
      testMatch: /auth-entry\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 740 },
        baseURL: "http://localhost:3941",
      },
    },
    {
      // Same auth-entry spec at 390px — the second mobile width called out for
      // the top-logo-not-clipped check.
      name: "auth-390",
      testMatch: /auth-entry\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
        baseURL: "http://localhost:3941",
      },
    },
  ],
  webServer: [
    {
      command: "next start -p 3939",
      url: "http://localhost:3939/api/nutrition/analyze-photo",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_BETA_DISABLE_GATE: "1",
        NUTRITION_AI_MOCK: "1",
      },
    },
    {
      command: "next start -p 3940",
      url: "http://localhost:3940/api/nutrition/analyze-photo",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_BETA_DISABLE_GATE: "1",
      },
    },
    {
      // Gate-ENABLED build (.next-auth) so the real sign-in screen renders. The
      // bypass is NOT set here; NEXT_DIST_DIR points `next start` at the second
      // build produced by scripts/e2e.mjs. The "/" route serves a 200 (the app
      // shell with the sign-in overlay), so it doubles as the health-check URL.
      command: "next start -p 3941",
      url: "http://localhost:3941/",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_DIST_DIR: ".next-auth",
      },
    },
  ],
});
