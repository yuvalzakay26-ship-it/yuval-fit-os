import { test, expect, type Page } from "@playwright/test";

// QA for the Today "command center" clarity pass (docs/TODAY_CLARITY_PASS.md).
// Runs against the :3939 server, where the beta access gate is bypassed
// (NEXT_PUBLIC_BETA_DISABLE_GATE=1). We seed localStorage before load and assert:
//   • the primary command area (daily progress + next action) renders;
//   • an in-progress active-workout draft is surfaced high on the page;
//   • "סיכום היום" is demoted to a collapsible section (closed by default);
//   • the gym card copy adapts to the saved-visit state instead of always
//     offering "נכנסתי למכון".
// No schemas / storage keys / business logic are touched by this pass.

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function seedBase(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      localStorage.setItem("yfos:beta-welcome-seen:v1", "1");
    } catch {
      /* ignore */
    }
  });
}

// Seed a completed (saved) gym visit for today — no active visit.
async function seedCompletedVisitToday(page: Page) {
  await page.addInitScript(
    ({ date }) => {
      try {
        const start = `${date}T08:00:00.000Z`;
        const end = `${date}T09:00:00.000Z`;
        localStorage.setItem(
          "yfos:gym-visits:v1",
          JSON.stringify([
            {
              id: "visit-today",
              startedAt: start,
              endedAt: end,
              durationMs: 60 * 60 * 1000,
              createdAt: start,
            },
          ]),
        );
      } catch {
        /* ignore */
      }
    },
    { date: todayISO() },
  );
}

// Seed a meaningful in-progress active-workout draft.
async function seedWorkoutDraft(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "yfos:active-workout-draft:v1",
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          title: "אימון בוקר",
          entries: [
            {
              exerciseId: "seed-ex-1",
              sets: [{ id: "s1", kg: 40, reps: 10, completed: false }],
            },
          ],
        }),
      );
    } catch {
      /* ignore */
    }
  });
}

test("Today renders the primary command area", async ({ page }) => {
  await seedBase(page);
  await page.goto("/");
  // Daily progress + the single most-important next action are both present.
  await expect(page.getByText("התקדמות היום")).toBeVisible();
  await expect(page.getByText("הפעולה הבאה שלך")).toBeVisible();
  // Compact status overview + quick actions still render.
  await expect(page.getByRole("heading", { name: "מבט מהיר" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "פעולות מהירות" }),
  ).toBeVisible();
});

test("an in-progress workout draft is surfaced high on Today", async ({
  page,
}) => {
  await seedBase(page);
  await seedWorkoutDraft(page);
  await page.goto("/");
  const resume = page.getByRole("link", { name: /המשך אימון/ });
  await expect(resume).toBeVisible();
  await expect(page.getByText("אימון בתהליך")).toBeVisible();
  await expect(page.getByText("אימון בוקר")).toBeVisible();
});

test("'סיכום היום' is collapsed by default and expands on tap", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /סיכום היום/ });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  // The detailed "תזונה היום" card is hidden until the section is expanded.
  await expect(page.getByText("תזונה היום")).toHaveCount(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("תזונה היום")).toBeVisible();
});

test("gym card offers check-in when no visit was logged today", async ({
  page,
}) => {
  await seedBase(page);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "נכנסתי למכון" }),
  ).toBeVisible();
  // No "view today's visit" CTA when nothing was logged.
  await expect(
    page.getByRole("link", { name: "צפה בביקור היום" }),
  ).toHaveCount(0);
});

test("gym card promotes 'view today's visit' once a visit is saved today", async ({
  page,
}) => {
  await seedBase(page);
  await seedCompletedVisitToday(page);
  await page.goto("/");
  // Primary action no longer reads like starting a duplicate visit.
  await expect(
    page.getByRole("link", { name: "צפה בביקור היום" }),
  ).toBeVisible();
  await expect(page.getByText("כבר נשמר ביקור במכון היום")).toBeVisible();
  // The bold standalone "נכנסתי למכון" primary is gone; only the quiet
  // "נכנסתי שוב למכון" re-entry path remains.
  await expect(
    page.getByRole("button", { name: "נכנסתי למכון", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "נכנסתי שוב למכון" }),
  ).toBeVisible();
});
