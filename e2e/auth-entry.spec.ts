import { test, expect } from "@playwright/test";

// Auth entry / sign-in screen QA. Unlike the rest of the suite (which runs
// against the gate-BYPASSED build on :3939/:3940), this spec runs against the
// gate-ENABLED build on :3941 (scripts/e2e.mjs builds it with dummy Supabase
// config into .next-auth). There, BetaAuthGate resolves to "signed out" and
// renders the real BetaSignInScreen — letting us pin the product decision:
//   • Google is the ONLY active sign-in method.
//   • The email magic-link UI is hidden (no input, no "send link" button).
//   • "Continue as guest" is visible but LOCKED ("בקרוב") — it creates no
//     guest session and enters nothing.
//   • The top logo is fully visible (not clipped) at 360px and 390px.
// Both auth projects (auth-360 / auth-390) run this file, so every assertion is
// exercised at both mobile widths.

const GUEST_KEY = "yuval-fit-os:guest-session:v1";

test.beforeEach(async ({ page }) => {
  // Clear the first-visit welcome so only the sign-in overlay is under test.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/");
});

test("sign-in screen renders with the top logo fully visible (no clipping)", async ({
  page,
}) => {
  const logo = page.locator("[data-auth-logo]");
  await expect(logo).toBeVisible();

  // The brand logo must be fully on-screen — its top edge not cut above the
  // viewport and its bottom edge within it. This is the regression guard for the
  // old top-clipping bug on short mobile heights.
  const box = await logo.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    const viewport = page.viewportSize();
    if (viewport) {
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  }

  // No horizontal overflow on the entry screen.
  const overflowsX = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflowsX).toBe(false);

  // The title is present so we know we're on the sign-in screen, not a fallback.
  await expect(
    page.getByRole("heading", { name: "כניסה לבטא של Fit OS" }),
  ).toBeVisible();
});

test("Google is the only active sign-in method; email UI is hidden", async ({
  page,
}) => {
  // Google button: visible and enabled.
  const google = page.getByRole("button", { name: /המשך עם Google/ });
  await expect(google).toBeVisible();
  await expect(google).toBeEnabled();

  // No email input field.
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator("#beta-email")).toHaveCount(0);

  // No "send email login link" button.
  await expect(
    page.getByRole("button", { name: /שלח קישור כניסה/ }),
  ).toHaveCount(0);
});

test("guest entry is visible but locked, and creates no session when clicked", async ({
  page,
}) => {
  const guest = page.locator("[data-guest-continue]");
  await expect(guest).toBeVisible();
  await expect(guest).toBeDisabled();
  await expect(guest).toHaveAttribute("aria-disabled", "true");

  // "Coming soon" badge + helper copy communicate the locked state.
  await expect(guest.getByText("בקרוב")).toBeVisible();
  await expect(
    page.getByText(/כניסה כאורח תהיה זמינה בהמשך/),
  ).toBeVisible();

  // Attempting to click must NOT write the guest key and must NOT enter the app.
  await guest.click({ force: true }).catch(() => {
    /* a disabled button may reject the click — that's the point */
  });

  const guestFlag = await page.evaluate(
    (key) => localStorage.getItem(key),
    GUEST_KEY,
  );
  expect(guestFlag).toBeNull();

  // Still on the sign-in screen (did not enter the app).
  await expect(
    page.getByRole("heading", { name: "כניסה לבטא של Fit OS" }),
  ).toBeVisible();
});

test("public legal links still work from the entry screen", async ({ page }) => {
  await page.getByRole("link", { name: "מדיניות פרטיות" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByRole("heading", { name: "מדיניות פרטיות", level: 1 }),
  ).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: "תנאי שימוש" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(
    page.getByRole("heading", { name: "תנאי שימוש ובטא", level: 1 }),
  ).toBeVisible();
});
