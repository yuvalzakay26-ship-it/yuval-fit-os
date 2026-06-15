// QA pass for the Today "command center" hierarchy polish (Phase 3.xx).
// Usage: node scripts/qa-today-command-center.mjs
//        (expects a production server on QA_BASE, default http://localhost:3100)
//
// This pass guards the HIERARCHY + duplicate-CTA-reduction polish — it does NOT
// touch storage, schema, routes, or Next Action logic. It asserts:
//
//   1. Fresh/new user — Today is short and not repetitive: the Next Action is
//      water, there is NO second full water card duplicating that CTA, the
//      supplements empty state does not dominate (it is absent), yet the compact
//      status + quick actions stay visible.
//   2. Water next action — no full "מים היום" card repeats the primary CTA, but
//      water status is still visible in the compact strip.
//   3. Active workout draft — the "אימון בתהליך" resume card appears HIGH on the
//      page (above the מבט מהיר strip) so the active session is obvious.
//   4. Engaged user (water + food + workout done, supplements configured) — the
//      full water + supplements cards return (no duplication of the Next Action,
//      which is now supplements) and reflect real totals.
//   5. Quick actions navigate correctly (add water / add food / start workout /
//      mark supplements).
//
// Runs at 360px and 390px in light and dark, asserting zero horizontal overflow
// and no console / hydration errors. Pure UI over localStorage.

import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.QA_BASE ?? "http://localhost:3100";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};

// App LOCAL ISO date (matches lib/utils `toISODate`) — see today-dashboard-check.
const localISODate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = localISODate();

const newCtx = async (width, scheme, seed = {}) => {
  const ctx = await browser.newContext({
    viewport: { width, height: 820 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  await ctx.addInitScript((pairs) => {
    try {
      localStorage.setItem("yfos:welcome-seen:v1", "1");
      sessionStorage.setItem(
        "yfos:private-access-notice-accepted:session",
        "1",
      );
      localStorage.setItem("yfos:admin-access-granted:v1", "1");
      for (const [k, v] of pairs) localStorage.setItem(k, v);
    } catch {}
  }, Object.entries(seed));
  return ctx;
};

const noOverflow = (page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

// Rich seed: 3 core pillars done today + supplements configured (1 of 2 taken).
const richSeed = {
  "yfos:workouts": JSON.stringify([
    {
      id: "w1",
      date: today,
      title: "אימון גב וביצפס",
      muscleGroups: ["back", "biceps"],
      exercises: [
        {
          exerciseId: "lat-pulldown",
          sets: [{ setNumber: 1, weightKg: 60, reps: 10, completed: true }],
        },
      ],
    },
  ]),
  "yfos:foodLogs": JSON.stringify([
    {
      id: "f1",
      date: today,
      mealType: "breakfast",
      foodName: "שייק חלבון",
      quantityText: "1",
      protein: 30,
      carbs: 20,
      fat: 5,
      calories: 250,
    },
  ]),
  "yfos:water-logs:v1": JSON.stringify([
    {
      date: today,
      totalMl: 1500,
      entries: [{ id: "e1", amountMl: 1500, createdAt: today + "T08:00:00Z" }],
    },
  ]),
  "yfos:supplements:v1": JSON.stringify([
    {
      id: "s1",
      name: "ויטמין D",
      category: "vitamin",
      isActive: true,
      createdAt: today + "T00:00:00Z",
      schedule: { frequency: "daily", timesOfDay: ["morning"] },
    },
    {
      id: "s2",
      name: "אומגה 3",
      category: "general-health",
      isActive: true,
      createdAt: today + "T00:00:00Z",
      schedule: { frequency: "daily", timesOfDay: ["noon"] },
    },
  ]),
  "yfos:supplement-logs:v1": JSON.stringify([
    { id: "l1", supplementId: "s1", date: today, takenAt: today + "T09:00:00Z" },
  ]),
};

// An active (live) gym visit — drives the prominent active-state placement.
const gymActiveSeed = {
  "yfos:active-gym-visit:v1": JSON.stringify({
    id: "v-active",
    startedAt: today + "T07:15:00Z",
    createdAt: today + "T07:15:00Z",
  }),
};

// A meaningful in-progress active-workout draft (title + entries).
const draftSeed = {
  "yfos:active-workout-draft:v1": JSON.stringify({
    version: 1,
    updatedAt: today + "T10:30:00Z",
    title: "אימון רגליים",
    entries: [
      {
        exerciseId: "lat-pulldown",
        sets: [
          { setNumber: 1, weightKg: 80, reps: 8, completed: true },
          { setNumber: 2, weightKg: 80, reps: 8, completed: false },
        ],
      },
    ],
  }),
};

for (const scheme of ["dark", "light"]) {
  for (const width of [360, 390]) {
    const tag = `${scheme}/${width}`;

    /* ===== 1 + 2. Fresh user: short, non-repetitive, water is next action. */
    {
      const ctx = await newCtx(width, scheme);
      const page = await ctx.newPage();
      page.on(
        "console",
        (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
      );
      page.on("pageerror", (e) =>
        errors.push(`[${tag}] pageerror: ${e.message}`),
      );
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const text = await page.evaluate(() => document.body.innerText);

      check(
        `[${tag}] fresh: Next Action is water (שתה כוס מים ראשונה)`,
        text.includes("שתה כוס מים ראשונה"),
      );
      check(
        `[${tag}] fresh: NO duplicate full water card (no "מים היום")`,
        !text.includes("מים היום"),
      );
      check(
        `[${tag}] fresh: supplements empty state does NOT dominate (absent)`,
        !text.includes("עדיין לא הוגדרו תוספים"),
      );
      check(
        `[${tag}] fresh: "הרגלים יומיים" section drops out entirely`,
        !text.includes("הרגלים יומיים"),
      );
      check(
        `[${tag}] fresh: water status still visible in compact strip`,
        text.includes("מבט מהיר"),
      );
      check(
        `[${tag}] fresh: quick actions visible (הוסף מים shortcut)`,
        text.includes("פעולות מהירות") && text.includes("הוסף מים"),
      );
      check(
        `[${tag}] fresh: no active-workout card when no draft`,
        !text.includes("אימון בתהליך"),
      );
      check(`[${tag}] fresh: no overflow`, (await noOverflow(page)) <= 1);
      if (width === 390) {
        await page.screenshot({
          path: `${OUT}/today-cc-fresh-${scheme}.png`,
          fullPage: true,
        });
      }
      await ctx.close();
    }

    /* ===== 3. Active workout draft surfaces high on the page. */
    {
      const ctx = await newCtx(width, scheme, draftSeed);
      const page = await ctx.newPage();
      page.on(
        "console",
        (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
      );
      page.on("pageerror", (e) =>
        errors.push(`[${tag}] pageerror: ${e.message}`),
      );
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const text = await page.evaluate(() => document.body.innerText);

      check(
        `[${tag}] draft: "אימון בתהליך" resume card present`,
        text.includes("אימון בתהליך"),
      );
      check(
        `[${tag}] draft: shows the draft title (אימון רגליים)`,
        text.includes("אימון רגליים"),
      );
      // It must sit ABOVE the compact status strip ("מבט מהיר").
      check(
        `[${tag}] draft: resume card appears ABOVE the מבט מהיר strip`,
        text.indexOf("אימון בתהליך") < text.indexOf("מבט מהיר"),
      );
      // The card links to the workouts hub (where continue/discard lives).
      const resumeHref = await page
        .getByRole("link", { name: /המשך אימון/ })
        .first()
        .getAttribute("href");
      check(
        `[${tag}] draft: resume card links to /workouts`,
        resumeHref === "/workouts",
      );
      check(`[${tag}] draft: no overflow`, (await noOverflow(page)) <= 1);
      if (width === 390) {
        await page.screenshot({
          path: `${OUT}/today-cc-draft-${scheme}.png`,
          fullPage: true,
        });
      }
      await ctx.close();
    }

    /* ===== 3b. Active gym visit is promoted to the top, not buried. */
    {
      const ctx = await newCtx(width, scheme, gymActiveSeed);
      const page = await ctx.newPage();
      page.on(
        "console",
        (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
      );
      page.on("pageerror", (e) =>
        errors.push(`[${tag}] pageerror: ${e.message}`),
      );
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const text = await page.evaluate(() => document.body.innerText);

      check(
        `[${tag}] gym: live "אתה במכון עכשיו" card present`,
        text.includes("אתה במכון עכשיו"),
      );
      // The live gym card must sit ABOVE the compact status strip.
      check(
        `[${tag}] gym: live card appears ABOVE the מבט מהיר strip`,
        text.indexOf("אתה במכון עכשיו") < text.indexOf("מבט מהיר"),
      );
      // It must not also render the idle "נוכחות במכון" section (no duplicate).
      check(
        `[${tag}] gym: idle "נוכחות במכון" section is NOT also shown`,
        !text.includes("נוכחות במכון"),
      );
      check(
        `[${tag}] gym: live check-out (סיים שהייה במכון) available`,
        text.includes("סיים שהייה במכון"),
      );
      check(`[${tag}] gym: no overflow`, (await noOverflow(page)) <= 1);
      if (width === 390) {
        await page.screenshot({
          path: `${OUT}/today-cc-gym-active-${scheme}.png`,
          fullPage: true,
        });
      }
      await ctx.close();
    }

    /* ===== 4. Engaged user: full water + supplements cards return. */
    {
      const ctx = await newCtx(width, scheme, richSeed);
      const page = await ctx.newPage();
      page.on(
        "console",
        (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`),
      );
      page.on("pageerror", (e) =>
        errors.push(`[${tag}] pageerror: ${e.message}`),
      );
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const text = await page.evaluate(() => document.body.innerText);

      check(
        `[${tag}] rich: next action is supplements (core habits done)`,
        text.includes("סמן את התוספים של היום"),
      );
      check(
        `[${tag}] rich: full water card returns (water not next action)`,
        text.includes("מים היום") && text.includes("1.5 ליטר"),
      );
      check(
        `[${tag}] rich: supplements card returns when configured`,
        text.includes("1 מתוך 2 סומנו"),
      );
      // No active gym visit → the idle gym section stays in its lower slot.
      check(
        `[${tag}] rich: idle gym section present (no live visit)`,
        text.includes("נוכחות במכון"),
      );
      check(`[${tag}] rich: no overflow`, (await noOverflow(page)) <= 1);
      if (width === 390) {
        await page.screenshot({
          path: `${OUT}/today-cc-rich-${scheme}.png`,
          fullPage: true,
        });
      }
      await ctx.close();
    }

    /* ===== 5. Quick actions navigate (checked once, on light/390). */
    if (scheme === "light" && width === 390) {
      const ctx = await newCtx(width, scheme);
      const page = await ctx.newPage();
      const nav = async (label, expect) => {
        await page.goto(BASE + "/", { waitUntil: "networkidle" });
        await page
          .getByRole("link", { name: label, exact: true })
          .first()
          .click();
        // App Router navigates client-side (no load event) — poll the URL.
        const ok = await page
          .waitForFunction((e) => location.href.includes(e), expect, {
            timeout: 8000,
          })
          .then(() => true)
          .catch(() => false);
        check(`[${tag}] quick action "${label}" → ${expect}`, ok);
      };
      try {
        await nav("התחל אימון", "/workouts?new=1");
        await nav("הוסף אוכל", "/nutrition/add");
        await nav("הוסף מים", "/nutrition/water");
        await nav("סמן תוספים", "/nutrition/supplements");
      } catch (e) {
        check(`[${tag}] quick actions navigate`, false);
        errors.push(`[${tag}] quick action nav failed: ${e.message}`);
      }
      await ctx.close();
    }
  }
}

await browser.close();
if (errors.length) {
  console.log(`CONSOLE ERRORS:\n${errors.join("\n")}`);
  failures++;
} else {
  console.log("No console errors.");
}
process.exit(failures ? 1 : 0);
