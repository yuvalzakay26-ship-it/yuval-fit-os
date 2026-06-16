import { test, expect, type Page } from "@playwright/test";

// QA for the app-wide "supplement taken" success celebration
// (docs/SUPPLEMENT_TAKEN_CELEBRATION.md). Runs against the :3939 server, where
// the beta access gate is bypassed (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed a
// couple of active supplements (and optionally a taken-today log) into
// localStorage before load, then drive the real toggle on Today and the
// Supplements screen and assert the one-shot overlay.
//
// The celebration fires only on the not-taken → taken edge, so it must NOT play
// on render / loading existing logs, nor when un-marking.

const CELEBRATION = '[data-supplement-celebration="active"]';

type SeedLog = { supplementId: string; date: string };

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function seedSupplements(page: Page, takenLogs: SeedLog[] = []) {
  await page.addInitScript(
    ({ logs, date }) => {
      try {
        localStorage.setItem("yfos:welcome-seen:v1", "1");
        localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
        const createdAt = "2026-01-01T00:00:00.000Z";
        localStorage.setItem(
          "yfos:supplements:v1",
          JSON.stringify([
            {
              id: "sup-creatine",
              name: "קריאטין",
              category: "performance",
              isActive: true,
              createdAt,
            },
            {
              id: "sup-vitd",
              name: "ויטמין D",
              category: "vitamin",
              isActive: true,
              createdAt,
            },
          ]),
        );
        localStorage.setItem(
          "yfos:supplement-logs:v1",
          JSON.stringify(
            logs.map((l: { supplementId: string }, i: number) => ({
              id: `seed-log-${i}`,
              supplementId: l.supplementId,
              date,
              takenAt: `${date}T08:00:00.000Z`,
            })),
          ),
        );
      } catch {
        /* ignore */
      }
    },
    { logs: takenLogs, date: todayISO() },
  );
}

test("no celebration overlay renders on load", async ({ page }) => {
  await seedSupplements(page);
  await page.goto("/");
  await expect(page.locator(CELEBRATION)).toHaveCount(0);
});

test("loading an already-taken supplement does not trigger the celebration", async ({
  page,
}) => {
  // A taken-today log is present at load — the overlay must stay dormant.
  await seedSupplements(page, [{ supplementId: "sup-creatine", date: todayISO() }]);
  await page.goto("/");
  await expect(page.getByText("קריאטין").first()).toBeVisible();
  await expect(page.locator(CELEBRATION)).toHaveCount(0);
});

test("marking a supplement on Today triggers the success overlay with its name", async ({
  page,
}) => {
  await seedSupplements(page);
  await page.goto("/");
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  await page.getByRole("button", { name: "סמן שקריאטין נלקח" }).click();

  const overlay = page.locator(CELEBRATION);
  await expect(overlay).toBeVisible();
  await expect(overlay.getByText("קריאטין הוזן בהצלחה")).toBeVisible();
  // One-shot — it self-dismisses with no modal to close.
  await expect(overlay).toHaveCount(0, { timeout: 4000 });
});

test("marking a supplement on the Supplements screen triggers the same overlay", async ({
  page,
}) => {
  await seedSupplements(page);
  await page.goto("/nutrition/supplements");
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  await page.getByRole("button", { name: "סמן שויטמין D נלקח" }).click();

  const overlay = page.locator(CELEBRATION);
  await expect(overlay).toBeVisible();
  await expect(overlay.getByText("ויטמין D הוזן בהצלחה")).toBeVisible();
});

test("re-tapping an already-taken supplement (un-mark) does not celebrate", async ({
  page,
}) => {
  await seedSupplements(page, [{ supplementId: "sup-creatine", date: todayISO() }]);
  await page.goto("/");
  // The seeded item is already taken — tapping it un-marks, no new transition.
  await page.getByRole("button", { name: "בטל סימון לקריאטין" }).click();
  await expect(page.locator(CELEBRATION)).toHaveCount(0);
});

test("un-marking then marking again can trigger the celebration again", async ({
  page,
}) => {
  await seedSupplements(page, [{ supplementId: "sup-creatine", date: todayISO() }]);
  await page.goto("/");

  // Un-mark (taken → not taken): no celebration.
  await page.getByRole("button", { name: "בטל סימון לקריאטין" }).click();
  await expect(page.locator(CELEBRATION)).toHaveCount(0);

  // Mark again (not taken → taken): a fresh edge, so it celebrates.
  await page.getByRole("button", { name: "סמן שקריאטין נלקח" }).click();
  await expect(page.locator(CELEBRATION)).toBeVisible();
});
