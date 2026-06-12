// Starts `next dev` and opens the app in Google Chrome (only) once the server is ready.
import { spawn } from "node:child_process";

const next = spawn("next", ["dev", ...process.argv.slice(2)], {
  stdio: ["inherit", "pipe", "inherit"],
  shell: true,
});

let opened = false;

function openChrome(url) {
  if (opened) return;
  opened = true;

  if (process.platform === "win32") {
    // `start chrome` resolves Chrome via the Windows "App Paths" registry entry.
    spawn("cmd", ["/c", "start", "chrome", url], { stdio: "ignore" }).unref();
  } else if (process.platform === "darwin") {
    spawn("open", ["-a", "Google Chrome", url], { stdio: "ignore" }).unref();
  } else {
    spawn("google-chrome", [url], { stdio: "ignore" }).unref();
  }
}

next.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text); // keep the normal Next.js terminal output

  const match = text.match(/http:\/\/localhost:\d+/);
  if (match) openChrome(match[0]);
});

next.on("exit", (code) => process.exit(code ?? 0));
