import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:390,height:844} });
const p = await ctx.newPage();
const errors = [];
p.on("console", m => { if (m.type()==="error") errors.push(m.text()); });
p.on("pageerror", e => errors.push(String(e)));

await p.goto(BASE + "/", { waitUntil:"networkidle" });
// Wait for the SW to register & take control.
const sw = await p.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return { supported:false };
  const reg = await navigator.serviceWorker.ready.catch(()=>null);
  // give it a moment to claim
  await new Promise(r => setTimeout(r, 800));
  return {
    supported: true,
    hasRegistration: !!reg,
    scope: reg?.scope || null,
    active: !!reg?.active,
    controller: !!navigator.serviceWorker.controller,
  };
});

// Manifest reachable + parseable
const manifest = await p.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return { linked:false };
  const res = await fetch(link.href);
  const j = await res.json();
  return { linked:true, name:j.name, display:j.display, icons:j.icons?.length,
           has192:j.icons?.some(i=>i.sizes==="192x192"), has512:j.icons?.some(i=>i.sizes==="512x512"),
           maskable:j.icons?.some(i=>i.purpose==="maskable") };
});

// Reload to confirm controller present on subsequent navigation
await p.reload({ waitUntil:"networkidle" });
const controlledAfterReload = await p.evaluate(() => !!navigator.serviceWorker.controller);

console.log(JSON.stringify({ sw, manifest, controlledAfterReload, errors }, null, 2));
await b.close();
