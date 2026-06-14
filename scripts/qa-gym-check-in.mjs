// QA pass for the Gym Check-In / Check-Out feature (Phase 3.xx).
// Usage: node scripts/qa-gym-check-in.mjs  (expects `next start -p 3334` running)
//
// Gym attendance tracks *being at the gym* (entry, exit, duration) — separate
// from workout logging. This verifies, end to end:
//   • Empty state: no active visit, no history, friendly copy.
//   • Check-in creates an active visit + live timer, and it survives a reload.
//   • Check-out saves a visit (startedAt/endedAt/durationMs), clears the active
//     slot, shows success + a history row.
//   • Deleting the open visit / a saved visit both require confirmation.
//   • A long-open visit shows the calm "forgot to check out?" warning and does
//     NOT auto-close.
//   • Today check-in/check-out works and lands in /gym history.
//   • Progress shows gym stats from visit history.
//   • Backup export includes gymVisits + activeGymVisit and restore brings them
//     back — without touching workout history.
//   • 360/390 no overflow, light + dark, no console errors.
// localStorage-only, no backend, no GPS.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3334";
const OUT = ".qa-shots";
fs.mkdirSync(OUT, { recursive: true });

const VISITS_KEY = "yfos:gym-visits:v1";
const ACTIVE_KEY = "yfos:active-gym-visit:v1";

const browser = await chromium.launch();
const errors = [];
let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};
const noOverflow = (page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

// Seed only the three gates — no gym data, so we start from the empty state.
const seedGates = () => {
  try {
    localStorage.setItem("yfos:welcome-seen:v1", "1");
    sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
    localStorage.setItem("yfos:admin-access-granted:v1", "1");
  } catch {}
};

const newCtx = async (opts = {}) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 900 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "light",
    acceptDownloads: true,
    ...opts,
  });
  await ctx.addInitScript(seedGates);
  return ctx;
};
const wire = (page, tag) => {
  page.on("console", (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
};

/* ===================================================================== *
 * 1. Empty state.                                                       *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "empty");
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });
  check(
    "[empty] /gym title visible",
    await page.getByRole("heading", { name: "נוכחות במכון" }).isVisible(),
  );
  check(
    "[empty] check-in button shown",
    await page.getByRole("button", { name: "נכנסתי למכון" }).isVisible(),
  );
  check(
    "[empty] friendly empty history copy",
    await page.getByText("אין ביקורים עדיין").isVisible(),
  );
  check(
    "[empty] no active visit in storage",
    (await page.evaluate((k) => localStorage.getItem(k), ACTIVE_KEY)) === null,
  );
  await ctx.close();
}

/* ===================================================================== *
 * 2. Check-in → active timer → persists across reload.                  *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "checkin");
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "נכנסתי למכון" }).click();
  check(
    "[checkin] active card 'אתה במכון' shown",
    await page.getByText("אתה במכון 💪").isVisible(),
  );
  check(
    "[checkin] check-out button shown",
    await page.getByRole("button", { name: "סיים שהייה במכון" }).isVisible(),
  );
  const active = await page.evaluate((k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "null");
    } catch {
      return null;
    }
  }, ACTIVE_KEY);
  check("[checkin] active visit persisted", active && typeof active.startedAt === "string");

  // Live timer ticks (HH:MM:SS) and is still active after a full reload.
  const timer1 = await page.getByText(/^\d{2}:\d{2}:\d{2}$/).first().innerText();
  await page.waitForTimeout(1200);
  const timer2 = await page.getByText(/^\d{2}:\d{2}:\d{2}$/).first().innerText();
  check("[checkin] timer advances", timer1 !== timer2);

  await page.reload({ waitUntil: "networkidle" });
  check(
    "[checkin] active visit survives reload",
    await page.getByText("אתה במכון 💪").isVisible(),
  );
  check(
    "[checkin] timer still running after reload",
    await page.getByText(/^\d{2}:\d{2}:\d{2}$/).first().isVisible(),
  );
  check("[checkin] no horizontal overflow", (await noOverflow(page)) === 0);
  await ctx.close();
}

/* ===================================================================== *
 * 3. Check-out → saved visit + success + history row.                   *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "checkout");
  // Seed an active visit started 90 minutes ago for a deterministic duration.
  await ctx.addInitScript((k) => {
    try {
      const started = new Date(Date.now() - 90 * 60 * 1000).toISOString();
      localStorage.setItem(
        k,
        JSON.stringify({ id: "gym_test1", startedAt: started, createdAt: started }),
      );
    } catch {}
  }, ACTIVE_KEY);
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "סיים שהייה במכון" }).click();
  check(
    "[checkout] confirm dialog appears",
    await page.getByRole("dialog", { name: "לסיים את השהייה במכון?" }).isVisible(),
  );
  await page
    .getByRole("dialog", { name: "לסיים את השהייה במכון?" })
    .getByRole("button", { name: "סיים שהייה" })
    .click();

  check(
    "[checkout] success feedback shown",
    await page.getByText("השהייה נשמרה").isVisible(),
  );
  const saved = await page.evaluate((k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "[]");
    } catch {
      return [];
    }
  }, VISITS_KEY);
  check("[checkout] one saved visit", saved.length === 1);
  check(
    "[checkout] saved visit has start/end/duration",
    saved[0] &&
      typeof saved[0].startedAt === "string" &&
      typeof saved[0].endedAt === "string" &&
      typeof saved[0].durationMs === "number" &&
      saved[0].durationMs > 0,
  );
  check(
    "[checkout] active slot cleared",
    (await page.evaluate((k) => localStorage.getItem(k), ACTIVE_KEY)) === null,
  );
  check(
    "[checkout] history row shows worded duration (1ש 30ד)",
    await page.getByText("1ש 30ד").first().isVisible(),
  );
  check(
    "[checkout] history row shows entry + exit labels",
    (await page.getByText("כניסה").first().isVisible()) &&
      (await page.getByText("יציאה").first().isVisible()),
  );
  check(
    "[checkout] no-linked-workout copy shown (no workout that day)",
    await page.getByText("לא קושר אימון לביקור הזה").first().isVisible(),
  );
  await ctx.close();
}

/* ===================================================================== *
 * 4. Delete the open visit (confirm required, no history written).      *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "del-active");
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "נכנסתי למכון" }).click();

  await page.getByRole("button", { name: "מחק כניסה פתוחה" }).first().click();
  check(
    "[del-active] confirm dialog appears",
    await page.getByRole("dialog", { name: "למחוק את הכניסה הפתוחה?" }).isVisible(),
  );
  await page
    .getByRole("dialog", { name: "למחוק את הכניסה הפתוחה?" })
    .getByRole("button", { name: "מחק" })
    .click();
  await page.waitForTimeout(150);
  check(
    "[del-active] active slot cleared",
    (await page.evaluate((k) => localStorage.getItem(k), ACTIVE_KEY)) === null,
  );
  check(
    "[del-active] nothing written to history",
    (await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").length, VISITS_KEY)) === 0,
  );
  check(
    "[del-active] back to idle check-in",
    await page.getByRole("button", { name: "נכנסתי למכון" }).isVisible(),
  );
  await ctx.close();
}

/* ===================================================================== *
 * 5. Delete a saved visit (confirm required).                           *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "del-saved");
  await ctx.addInitScript((k) => {
    try {
      const s = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const e = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(
        k,
        JSON.stringify([
          { id: "v1", startedAt: s, endedAt: e, durationMs: 3600000, createdAt: s },
        ]),
      );
    } catch {}
  }, VISITS_KEY);
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "מחק ביקור" }).first().click();
  check(
    "[del-saved] confirm dialog appears",
    await page.getByRole("dialog", { name: "למחוק את הביקור?" }).isVisible(),
  );
  await page
    .getByRole("dialog", { name: "למחוק את הביקור?" })
    .getByRole("button", { name: "מחק" })
    .click();
  await page.waitForTimeout(150);
  check(
    "[del-saved] visit removed from history",
    (await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").length, VISITS_KEY)) === 0,
  );
  check(
    "[del-saved] empty state returns",
    await page.getByText("אין ביקורים עדיין").isVisible(),
  );
  await ctx.close();
}

/* ===================================================================== *
 * 6. Long open visit → calm warning, no auto-close.                     *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "forgot");
  await ctx.addInitScript((k) => {
    try {
      const started = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(
        k,
        JSON.stringify({ id: "gym_long", startedAt: started, createdAt: started }),
      );
    } catch {}
  }, ACTIVE_KEY);
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });
  check(
    "[forgot] warning shown after threshold",
    await page.getByText("נראה שהשהייה פתוחה הרבה זמן").isVisible(),
  );
  check(
    "[forgot] visit NOT auto-closed (still active)",
    (await page.evaluate((k) => localStorage.getItem(k), ACTIVE_KEY)) !== null,
  );
  check(
    "[forgot] no visit auto-written to history",
    (await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").length, VISITS_KEY)) === 0,
  );
  await ctx.close();
}

/* ===================================================================== *
 * 7. Today integration: check-in + check-out, lands in /gym history.    *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "today");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check(
    "[today] gym section present",
    await page.getByText("נוכחות במכון").first().isVisible(),
  );
  check(
    "[today] prominent idle status copy shown",
    await page.getByText("עדיין לא נכנסת למכון היום").first().isVisible(),
  );
  await page.getByRole("button", { name: "נכנסתי למכון" }).click();
  await page.waitForTimeout(150);
  check(
    "[today] active live state appears on Today",
    await page.getByText("אתה במכון עכשיו").first().isVisible(),
  );
  check(
    "[today] active timer (HH:MM:SS) visible",
    await page.getByText(/^\d{2}:\d{2}:\d{2}$/).first().isVisible(),
  );
  check(
    "[today] active visit stored",
    (await page.evaluate((k) => localStorage.getItem(k), ACTIVE_KEY)) !== null,
  );
  await page.getByRole("button", { name: "סיים שהייה במכון" }).click();
  await page.waitForTimeout(150);
  check(
    "[today] check-out cleared active",
    (await page.evaluate((k) => localStorage.getItem(k), ACTIVE_KEY)) === null,
  );
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });
  check(
    "[today] visit landed in /gym history",
    (await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").length, VISITS_KEY)) === 1,
  );
  await ctx.close();
}

/* ===================================================================== *
 * 8. Progress integration: gym stats reflect visit history.             *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "progress");
  await ctx.addInitScript((k) => {
    try {
      const now = Date.now();
      const mk = (hAgo, dur) => {
        const s = new Date(now - hAgo * 3600000).toISOString();
        const e = new Date(now - hAgo * 3600000 + dur).toISOString();
        return { id: "v" + hAgo, startedAt: s, endedAt: e, durationMs: dur, createdAt: s };
      };
      localStorage.setItem(k, JSON.stringify([mk(2, 3600000), mk(26, 5400000)]));
    } catch {}
  }, VISITS_KEY);
  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  check(
    "[progress] gym attendance section shown",
    await page.getByText("נוכחות במכון").first().isVisible(),
  );
  check(
    "[progress] 'ביקורים השבוע' stat present",
    await page.getByText("ביקורים השבוע").first().isVisible(),
  );
  check("[progress] no horizontal overflow", (await noOverflow(page)) === 0);
  await ctx.close();
}

/* ===================================================================== *
 * 9. Backup integration: export includes gym data; restore brings back. *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "backup");
  await ctx.addInitScript(
    ([vk, ak]) => {
      try {
        const s = new Date(Date.now() - 3 * 3600000).toISOString();
        const e = new Date(Date.now() - 2 * 3600000).toISOString();
        localStorage.setItem(
          vk,
          JSON.stringify([
            { id: "v1", startedAt: s, endedAt: e, durationMs: 3600000, createdAt: s },
          ]),
        );
        localStorage.setItem(
          ak,
          JSON.stringify({ id: "gym_a", startedAt: s, createdAt: s }),
        );
        // A workout to prove restore never alters workout history schema.
        localStorage.setItem(
          "yfos:workouts",
          JSON.stringify([
            { id: "w1", date: "2026-06-14", title: "אימון", muscleGroups: ["chest"], exercises: [] },
          ]),
        );
      } catch {}
    },
    [VISITS_KEY, ACTIVE_KEY],
  );
  await page.goto(`${BASE}/backup`, { waitUntil: "networkidle" });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "ייצא גיבוי" }).click(),
  ]);
  const backupText = fs.readFileSync(await download.path(), "utf8");
  let json = null;
  try {
    json = JSON.parse(backupText);
  } catch {}
  check("[backup] export includes gymVisits (1)", (json?.data?.gymVisits ?? []).length === 1);
  check(
    "[backup] export includes activeGymVisit object",
    json?.data?.activeGymVisit && typeof json.data.activeGymVisit === "object",
  );
  const workoutsBefore = JSON.stringify(json?.data?.workouts ?? []);

  // Clear gym data, then restore from the exported text.
  await page.evaluate(
    ([vk, ak]) => {
      localStorage.removeItem(vk);
      localStorage.removeItem(ak);
    },
    [VISITS_KEY, ACTIVE_KEY],
  );
  await page.getByRole("button", { name: /הדבק טקסט גיבוי/ }).click();
  await page.getByLabel("הדבקת טקסט גיבוי").fill(backupText);
  await page.getByRole("button", { name: "טען מהטקסט" }).click();
  check(
    "[backup] preview lists gym visits row",
    await page.getByText("ביקורים במכון").first().isVisible(),
  );
  await page.getByRole("button", { name: "שחזר עכשיו" }).first().click();
  await page
    .getByRole("dialog", { name: "שחזור גיבוי" })
    .getByRole("button", { name: "שחזר עכשיו" })
    .click();
  check(
    "[backup] restore success shown",
    await page.getByText("הגיבוי שוחזר בהצלחה").isVisible(),
  );
  const after = await page.evaluate(
    ([vk, ak]) => ({
      visits: JSON.parse(localStorage.getItem(vk) || "[]").length,
      active: localStorage.getItem(ak) !== null,
      workouts: localStorage.getItem("yfos:workouts") || "[]",
    }),
    [VISITS_KEY, ACTIVE_KEY],
  );
  check("[backup] gym visits restored", after.visits === 1);
  check("[backup] active gym visit restored", after.active === true);
  check("[backup] workout history unchanged", after.workouts === workoutsBefore);
  await ctx.close();
}

/* ===================================================================== *
 * 11. Same-day re-entry guard: completed visit today → confirm before    *
 *     starting another; cancel does nothing, confirm starts a 2nd visit. *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "reentry");
  // One completed visit earlier *today* (so it counts as "visited today").
  await ctx.addInitScript((k) => {
    try {
      const s = new Date(Date.now() - 4 * 3600000).toISOString();
      const e = new Date(Date.now() - 3 * 3600000).toISOString();
      localStorage.setItem(
        k,
        JSON.stringify([
          { id: "today1", startedAt: s, endedAt: e, durationMs: 3600000, createdAt: s },
        ]),
      );
    } catch {}
  }, VISITS_KEY);
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });

  check(
    "[reentry] idle card shows 'already visited today' copy",
    await page.getByText("כבר נשמר ביקור במכון היום").first().isVisible(),
  );
  // Click check-in → confirmation dialog appears (no visit started yet).
  await page.getByRole("button", { name: "נכנסתי למכון" }).click();
  check(
    "[reentry] confirmation dialog appears",
    await page
      .getByRole("dialog", { name: "כבר נשמר ביקור במכון היום" })
      .isVisible(),
  );
  await page
    .getByRole("dialog", { name: "כבר נשמר ביקור במכון היום" })
    .getByRole("button", { name: "ביטול" })
    .click();
  await page.waitForTimeout(150);
  check(
    "[reentry] cancel does NOT create an active visit",
    (await page.evaluate((k) => localStorage.getItem(k), ACTIVE_KEY)) === null,
  );

  // Click again and confirm → a second visit is started.
  await page.getByRole("button", { name: "נכנסתי למכון" }).click();
  await page
    .getByRole("dialog", { name: "כבר נשמר ביקור במכון היום" })
    .getByRole("button", { name: "כן, התחל ביקור נוסף" })
    .click();
  await page.waitForTimeout(150);
  check(
    "[reentry] confirm starts a second (active) visit",
    (await page.evaluate((k) => localStorage.getItem(k), ACTIVE_KEY)) !== null,
  );
  // Finish it → history now holds two visits for the day.
  await page.getByRole("button", { name: "סיים שהייה במכון" }).click();
  await page
    .getByRole("dialog", { name: "לסיים את השהייה במכון?" })
    .getByRole("button", { name: "סיים שהייה" })
    .click();
  await page.waitForTimeout(150);
  check(
    "[reentry] two visits in history after confirmed re-entry",
    (await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").length, VISITS_KEY)) === 2,
  );
  await ctx.close();
}

/* ===================================================================== *
 * 12. Active-visit guard: while a visit is open there is no check-in —   *
 *     only check-out (no second active visit can be created).           *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "active-guard");
  await ctx.addInitScript((k) => {
    try {
      const s = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      localStorage.setItem(k, JSON.stringify({ id: "open1", startedAt: s, createdAt: s }));
    } catch {}
  }, ACTIVE_KEY);
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });
  check(
    "[active-guard] no check-in button while active",
    (await page.getByRole("button", { name: "נכנסתי למכון" }).count()) === 0,
  );
  check(
    "[active-guard] check-out button shown instead",
    await page.getByRole("button", { name: "סיים שהייה במכון" }).isVisible(),
  );
  const id = await page.evaluate((k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "null")?.id;
    } catch {
      return null;
    }
  }, ACTIVE_KEY);
  check("[active-guard] still the same single active visit", id === "open1");
  await ctx.close();
}

/* ===================================================================== *
 * 13. Workout linking: a workout saved during the visit window is        *
 *     snapshotted onto the visit at check-out (display-only).            *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "link");
  await ctx.addInitScript(
    ([ak]) => {
      try {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const s = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        localStorage.setItem(ak, JSON.stringify({ id: "v_link", startedAt: s, createdAt: s }));
        // A workout logged "today" (during the visit window). Workout history is
        // day-level, so same-day = inside the window.
        localStorage.setItem(
          "yfos:workouts",
          JSON.stringify([
            {
              id: "w_link",
              date: today,
              title: "גב + יד קדמית",
              muscleGroups: ["back", "biceps"],
              exercises: [{ exerciseId: "x", sets: [] }],
            },
          ]),
        );
      } catch {}
    },
    [ACTIVE_KEY],
  );
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "סיים שהייה במכון" }).click();
  await page
    .getByRole("dialog", { name: "לסיים את השהייה במכון?" })
    .getByRole("button", { name: "סיים שהייה" })
    .click();
  await page.waitForTimeout(150);
  check(
    "[link] history row shows linked workout title",
    await page.getByText("גב + יד קדמית").first().isVisible(),
  );
  const saved = await page.evaluate((k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "[]");
    } catch {
      return [];
    }
  }, VISITS_KEY);
  check(
    "[link] saved visit carries a workout snapshot",
    saved[0]?.workouts?.length === 1 && saved[0].workouts[0].title === "גב + יד קדמית",
  );
  check(
    "[link] workout history left intact (1 workout, unchanged title)",
    (await page.evaluate(() => {
      try {
        const ws = JSON.parse(localStorage.getItem("yfos:workouts") || "[]");
        return ws.length === 1 && ws[0].title === "גב + יד קדמית";
      } catch {
        return false;
      }
    })),
  );
  await ctx.close();
}

/* ===================================================================== *
 * 14. Old-data compatibility: a visit with no `workouts` field loads     *
 *     fine and shows the no-linked-workout copy (no crash).             *
 * ===================================================================== */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  wire(page, "old-data");
  await ctx.addInitScript((k) => {
    try {
      const s = new Date(Date.now() - 28 * 3600000).toISOString();
      const e = new Date(Date.now() - 27 * 3600000).toISOString();
      // First-version shape: NO `workouts` field at all.
      localStorage.setItem(
        k,
        JSON.stringify([
          { id: "old1", startedAt: s, endedAt: e, durationMs: 3600000, createdAt: s },
        ]),
      );
    } catch {}
  }, VISITS_KEY);
  await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });
  check(
    "[old-data] old visit renders (date visible)",
    (await page.getByText("משך שהייה").first().isVisible()),
  );
  check(
    "[old-data] no-linked-workout copy for old visit",
    await page.getByText("לא קושר אימון לביקור הזה").first().isVisible(),
  );
  await ctx.close();
}

/* ===================================================================== *
 * 10. Mobile widths + light/dark, no overflow, no hydration errors.     *
 * ===================================================================== */
for (const scheme of ["dark", "light"]) {
  for (const width of [360, 390]) {
    const ctx = await newCtx({ viewport: { width, height: 900 }, colorScheme: scheme });
    // Seed one saved visit + an active one so both card states get measured.
    await ctx.addInitScript(
      ([vk, ak]) => {
        try {
          const s = new Date(Date.now() - 40 * 60 * 1000).toISOString();
          localStorage.setItem(ak, JSON.stringify({ id: "a", startedAt: s, createdAt: s }));
          const ps = new Date(Date.now() - 26 * 3600000).toISOString();
          const pe = new Date(Date.now() - 25 * 3600000).toISOString();
          localStorage.setItem(
            vk,
            JSON.stringify([
              { id: "v1", startedAt: ps, endedAt: pe, durationMs: 3600000, createdAt: ps },
            ]),
          );
        } catch {}
      },
      [VISITS_KEY, ACTIVE_KEY],
    );
    const page = await ctx.newPage();
    const tag = `${scheme}/${width}`;
    wire(page, tag);
    await page.goto(`${BASE}/gym`, { waitUntil: "networkidle" });
    check(
      `[${tag}] active card visible`,
      await page.getByText("אתה במכון 💪").isVisible(),
    );
    check(`[${tag}] no horizontal overflow`, (await noOverflow(page)) === 0);
    if (width === 390) {
      await page.screenshot({ path: `${OUT}/gym-${scheme}.png`, fullPage: true });
    }
    await ctx.close();
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
