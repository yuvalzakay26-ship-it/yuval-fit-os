// QA pass for the Beta Access System (Phase 3.xx).
// Usage: node scripts/qa-beta-access.mjs
//
// Because NEXT_PUBLIC_* env vars are inlined at BUILD time, this script builds
// the app three times — once per configuration state — and serves each build to
// verify the gate behaves correctly. It is self-contained: it runs its own
// `next build` + `next start` per scenario and cleans up the server each time.
// No real Supabase project is needed (that is covered by the manual steps in
// docs/BETA_ACCESS_SYSTEM.md).
//
// Scenarios (run in this order so the working tree ends on a clean no-env build):
//   1. Gate disabled (NEXT_PUBLIC_BETA_DISABLE_GATE=1): the app is reachable —
//      proving the testing seam + that the existing app still renders.
//   2. Configured (dummy Supabase env): the sign-in screen renders (Google +
//      email magic link), Hebrew RTL, mobile-safe, no overflow.
//   3. No env (production fail-closed): the "not configured" screen blocks the
//      app — no dev "continue" button, no crash.
//
// Each scenario checks 360px + 390px in light + dark for overflow + console errors.

import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";

// Invoke the Next CLI through node directly so it works regardless of whether
// node_modules/.bin is on PATH (it isn't when run as `node scripts/...`).
const NEXT_BIN = "node_modules/next/dist/bin/next";
const PORT = 3478;
const BASE = `http://localhost:${PORT}`;
const OUT = ".qa-shots";
const DUMMY_HOST = "qa-dummy.supabase.co";
fs.mkdirSync(OUT, { recursive: true });

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

// Seed the private-access + welcome gates so only the beta gate is under test.
const seedGates = () => {
  try {
    localStorage.setItem("yfos:welcome-seen:v1", "1");
    sessionStorage.setItem(
      "yfos:private-access-notice-accepted:session",
      "1",
    );
  } catch {}
};

function buildWith(env) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [NEXT_BIN, "build"], {
      stdio: ["ignore", "ignore", "inherit"],
      env: { ...process.env, ...env },
    });
    proc.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`next build exited ${code}`)),
    );
    proc.on("error", reject);
  });
}

function startServer(env) {
  return spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], {
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, ...env },
  });
}

async function waitForReady(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not become ready");
}

async function stopServer(proc) {
  if (!proc || proc.exitCode !== null) return;
  await new Promise((resolve) => {
    proc.once("exit", () => resolve());
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      } else {
        proc.kill("SIGTERM");
      }
    } catch {}
    setTimeout(resolve, 4000);
  });
}

// Drive a fresh browser context across the mobile widths/themes for one page,
// running the supplied per-page assertions. Returns collected console errors.
async function forEachViewport(browser, path, label, assertFn) {
  const errors = [];
  for (const scheme of ["dark", "light"]) {
    for (const width of [360, 390]) {
      const ctx = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        colorScheme: scheme,
      });
      await ctx.addInitScript(seedGates);
      const page = await ctx.newPage();
      const tag = `${label} ${scheme}/${width}`;
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const text = m.text();
        // Network errors to the fake Supabase host are expected with dummy env.
        if (text.includes(DUMMY_HOST) || text.includes("net::") ||
            text.includes("Failed to load resource")) return;
        errors.push(`[${tag}] ${text}`);
      });
      page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message}`));

      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);
      await assertFn(page, tag, width === 390 && scheme === "dark");

      check(`[${tag}] no horizontal overflow`, (await noOverflow(page)) === 0);
      await ctx.close();
    }
  }
  return errors;
}

const browser = await chromium.launch();
const allConsole = [];

try {
  /* ============================ Scenario 1 ============================ */
  /* Gate disabled — the app shell must be reachable.                    */
  console.log("\n=== Scenario 1: gate disabled (NEXT_PUBLIC_BETA_DISABLE_GATE=1) ===");
  await buildWith({ NEXT_PUBLIC_BETA_DISABLE_GATE: "1" });
  let server = startServer({ NEXT_PUBLIC_BETA_DISABLE_GATE: "1" });
  await waitForReady();
  {
    const errs = await forEachViewport(browser, "/", "disabled", async (page, tag, shot) => {
      // No beta overlay should be present.
      check(
        `[${tag}] beta gate overlay absent`,
        (await page.locator("[data-beta-gate]").count()) === 0,
      );
      // The app is reachable: the bottom nav "היום" tab is visible.
      check(
        `[${tag}] app reachable (היום tab visible)`,
        await page.getByRole("link", { name: /היום/ }).first().isVisible(),
      );
      if (shot) {
        await page.screenshot({ path: `${OUT}/beta-gate-disabled.png`, fullPage: true });
      }
    });
    allConsole.push(...errs);
  }
  await stopServer(server);

  /* ============================ Scenario 2 ============================ */
  /* Configured (dummy env) — the sign-in screen renders.                */
  console.log("\n=== Scenario 2: configured (dummy Supabase env) — sign-in screen ===");
  const dummyEnv = {
    NEXT_PUBLIC_SUPABASE_URL: `https://${DUMMY_HOST}`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "qa-dummy-anon-key",
  };
  await buildWith(dummyEnv);
  server = startServer(dummyEnv);
  await waitForReady();
  {
    const errs = await forEachViewport(browser, "/", "signin", async (page, tag, shot) => {
      check(
        `[${tag}] sign-in heading visible`,
        await page.getByRole("heading", { name: "כניסה לבטא של Fit OS" }).isVisible(),
      );
      check(
        `[${tag}] Google button present`,
        await page.getByRole("button", { name: /המשך עם Google/ }).isVisible(),
      );
      check(
        `[${tag}] email magic-link button present`,
        await page.getByRole("button", { name: /שלח קישור כניסה לאימייל/ }).isVisible(),
      );
      check(
        `[${tag}] document is RTL`,
        (await page.evaluate(() => document.documentElement.dir)) === "rtl",
      );
      if (shot) {
        await page.screenshot({ path: `${OUT}/beta-signin.png`, fullPage: true });
      }
    });
    allConsole.push(...errs);
  }
  await stopServer(server);

  /* ============================ Scenario 3 ============================ */
  /* No env — production fail-closed config screen.                      */
  console.log("\n=== Scenario 3: no env (production fail-closed) ===");
  await buildWith({});
  server = startServer({});
  await waitForReady();
  {
    const errs = await forEachViewport(browser, "/", "failclosed", async (page, tag, shot) => {
      check(
        `[${tag}] not-configured screen visible`,
        await page.getByText("מערכת הגישה אינה מוקנפגת").isVisible(),
      );
      // Production must NOT offer the dev "continue anyway" escape.
      check(
        `[${tag}] no dev "continue anyway" button (fails closed)`,
        (await page.getByRole("button", { name: /המשך בכל זאת/ }).count()) === 0,
      );
      // The gate overlay actually COVERS the app (occlusion check — the app
      // shell is mounted underneath every gate, so isVisible alone is not proof).
      check(
        `[${tag}] gate overlay covers the app`,
        await page.evaluate(() => {
          const el = document.elementFromPoint(
            Math.floor(window.innerWidth / 2),
            Math.floor(window.innerHeight / 2),
          );
          return Boolean(el && el.closest("[data-beta-gate]"));
        }),
      );
      if (shot) {
        await page.screenshot({ path: `${OUT}/beta-fail-closed.png`, fullPage: true });
      }
    });
    allConsole.push(...errs);
  }
  await stopServer(server);
} finally {
  await browser.close();
}

if (allConsole.length) {
  console.log(`\nCONSOLE ERRORS:\n${allConsole.join("\n")}`);
  failures += allConsole.length;
} else {
  console.log("\nNo unexpected console errors.");
}

console.log(`\n${failures ? `FAILED (${failures})` : "ALL CHECKS PASSED"}`);
process.exit(failures ? 1 : 0);
