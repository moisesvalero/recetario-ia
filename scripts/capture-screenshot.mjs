import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mkdir } from "node:fs/promises";

const PORT = 4321;
const URL = `http://127.0.0.1:${PORT}`;
const OUT = "public/screenshot.png";

await mkdir("public", { recursive: true });

const preview = spawn("pnpm", ["preview", "--host", "127.0.0.1", "--port", String(PORT)], {
  stdio: "ignore",
  detached: true,
});

let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch(URL);
    if (res.ok) {
      ready = true;
      break;
    }
  } catch {
    // servidor aún arrancando
  }
  await sleep(1000);
}

if (!ready) {
  process.kill(-preview.pid, "SIGTERM");
  throw new Error("Preview server did not start on port 4321");
}

try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({ path: OUT, fullPage: false });
  await browser.close();
  console.log(`Screenshot saved to ${OUT}`);
} finally {
  if (preview.pid) {
    try {
      process.kill(-preview.pid, "SIGTERM");
    } catch {
      // el preview ya terminó solo
    }
  }
}
