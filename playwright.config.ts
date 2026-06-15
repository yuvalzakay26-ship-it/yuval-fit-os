import { defineConfig, devices } from "@playwright/test";

// QA harness for Yuval Fit OS. Tests run against a dev server with the testing
// seams enabled:
//   NEXT_PUBLIC_BETA_DISABLE_GATE=1  → bypass the beta access gate locally
//   NUTRITION_AI_MOCK=1              → photo scan returns a deterministic draft
//
// Run:  npx playwright install chromium   (first time, downloads the browser)
//       npx playwright test
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3939",
    locale: "he-IL",
  },
  projects: [
    {
      name: "mobile-390",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "next dev -p 3939",
    url: "http://localhost:3939/api/nutrition/analyze-photo",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_BETA_DISABLE_GATE: "1",
      NUTRITION_AI_MOCK: "1",
    },
  },
});
