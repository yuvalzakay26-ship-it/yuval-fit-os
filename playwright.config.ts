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
      // AI enabled (mock) — runs every spec except the disabled-state one.
      name: "mobile-390",
      testIgnore: /nutrition-photo-disabled\.spec\.ts/,
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
  ],
});
