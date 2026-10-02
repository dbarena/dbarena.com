import { spawn } from "node:child_process";
import { copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const LAYOUT_WIDTH = 1200;
const LAYOUT_HEIGHT = 630;
const SCALE = 2;

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(dir, "og.html");
const appDir = path.join(dir, "../src/app");
const ogOut = path.join(appDir, "opengraph-image.png");
const twitterOut = path.join(appDir, "twitter-image.png");

async function waitForFile(file, startedAt) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const info = await stat(file);
      if (info.size > 0 && info.mtimeMs >= startedAt) {
        return;
      }
    } catch {
      // not written yet
    }
    await delay(250);
  }
  throw new Error(`timed out waiting for ${file}`);
}

const startedAt = Date.now() - 500;
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--disable-extensions",
    "--user-data-dir=/tmp/dbarena-og-chrome-run",
    `--force-device-scale-factor=${SCALE}`,
    `--window-size=${LAYOUT_WIDTH},${LAYOUT_HEIGHT}`,
    "--virtual-time-budget=2500",
    `--screenshot=${ogOut}`,
    `file://${html}`,
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);

try {
  await waitForFile(ogOut, startedAt);
} finally {
  chrome.kill("SIGKILL");
}

await copyFile(ogOut, twitterOut);

console.log(
  `wrote opengraph-image.png and twitter-image.png at ${LAYOUT_WIDTH * SCALE}×${LAYOUT_HEIGHT * SCALE}`,
);
