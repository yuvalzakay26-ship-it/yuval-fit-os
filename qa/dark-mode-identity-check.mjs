// App-wide dark-mode colour identity QA. Dark mode used to collapse every
// feature accent (strength, energy, nutrition, learn, supplement) onto the
// emerald brand token, so the whole app read as one green wash. This check
// asserts each module keeps its own dark-tuned identity: the resolved feature
// accents are mutually distinct, none (except the brand itself) equals the
// emerald brand, and key module CTAs/icons render their own hue on screen.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";

const issues = [];
const ok = (label) => console.log(" ✓ " + label);
const fail = (label) => issues.push(label);
const check = (cond, label) => (cond ? ok(label) : fail(label));

// Normalise any CSS colour the browser resolves to a comparable rgb() string.
async function resolveVars(page, names) {
  return page.evaluate((vars) => {
    const probe = document.createElement("span");
    document.body.appendChild(probe);
    const out = {};
    for (const v of vars) {
      probe.style.color = `var(${v})`;
      out[v] = getComputedStyle(probe).color;
    }
    probe.remove();
    return out;
  }, names);
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("yfos:welcome-seen:v1", "1");
    sessionStorage.setItem("yfos:private-access-notice-accepted:session", "1");
    localStorage.setItem("yfos:admin-access-granted:v1", "1");
    // The theme lives in settings (the old media-query "system" mode was
    // removed), so dark mode must be opted in explicitly for this check to
    // exercise the real dark identity rather than the default light theme.
    localStorage.setItem("yfos:settings", JSON.stringify({ theme: "dark" }));
  });
  await page.reload({ waitUntil: "networkidle" });

  // Sanity: dark mode is actually applied.
  const isDark = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  );
  check(isDark, "dark mode is active (.dark on <html>)");

  /* ---- Each module accent resolves to its own distinct hue in dark ---- */
  const MODULES = [
    "--accent", // emerald brand
    "--accent-strength",
    "--accent-energy",
    "--accent-nutrition",
    "--accent-learn",
    "--accent-water",
    "--accent-supplement",
  ];
  const resolved = await resolveVars(page, MODULES);
  const values = MODULES.map((m) => resolved[m]);
  const distinct = new Set(values);
  check(
    distinct.size === MODULES.length,
    `all ${MODULES.length} module accents are distinct in dark (${distinct.size} unique)`,
  );

  // None of the non-brand feature accents may equal the emerald brand token —
  // that collapse was the whole bug.
  const brand = resolved["--accent"];
  for (const m of MODULES.filter((m) => m !== "--accent")) {
    check(resolved[m] !== brand, `${m} is not the emerald brand accent (${resolved[m]})`);
  }

  /* ---- Module CTAs / icons paint their own hue on real screens ---- */
  // Supplements add-button gradient should be violet, not emerald.
  await page.goto(BASE + "/nutrition/supplements", { waitUntil: "networkidle" });
  await page.waitForTimeout(120);
  const suppGrad = await page.$$eval("button, a", (els) =>
    els
      .filter((e) => /הוסף תוסף/.test(e.textContent || ""))
      .map((e) => getComputedStyle(e).backgroundImage)
      .join(" | "),
  );
  // Violet mid-stop rgb(192, 132, 252) — unambiguous proof it isn't emerald.
  check(
    suppGrad.includes("192, 132, 252"),
    "supplements CTA paints a violet gradient (not emerald)",
  );

  // Water screen: the gauge/icon area should carry cyan, not emerald.
  await page.goto(BASE + "/nutrition/water", { waitUntil: "networkidle" });
  await page.waitForTimeout(120);
  const waterCyan = await page.evaluate(() => {
    const probe = document.createElement("span");
    document.body.appendChild(probe);
    probe.style.color = "var(--accent-water)";
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  check(waterCyan !== brand, `water accent stays cyan in dark (${waterCyan})`);

  /* ---- No horizontal overflow on the main flows at 360 + 390 ---- */
  const ROUTES = ["/", "/workouts", "/nutrition", "/nutrition/water", "/nutrition/supplements", "/progress", "/settings"];
  for (const w of [360, 390]) {
    await page.setViewportSize({ width: w, height: 844 });
    for (const r of ROUTES) {
      await page.goto(BASE + r, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      if (overflow) fail(`horizontal overflow at ${w}px on ${r} (dark)`);
    }
    ok(`no horizontal overflow at ${w}px across main flows (dark)`);
  }

  await browser.close();
  console.log("\n===== DARK MODE IDENTITY QA ISSUES (" + issues.length + ") =====");
  issues.forEach((i) => console.log(" - " + i));
  if (issues.length === 0) console.log(" none 🎉");
  process.exit(issues.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("DARK MODE IDENTITY QA RUN FAILED:", e);
  process.exit(1);
});
