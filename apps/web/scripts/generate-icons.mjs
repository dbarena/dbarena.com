import { spawn } from "node:child_process";
import { stat, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZE = 512;
const SCALE = 2;

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(dir, "icon.html");
const source = path.join(dir, "icon-source.png");
const appDir = path.join(dir, "../src/app");
const publicDir = path.join(dir, "../public");

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

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code}`));
    });
  });
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
    "--user-data-dir=/tmp/dbarena-icon-chrome-run",
    `--force-device-scale-factor=${SCALE}`,
    `--window-size=${SIZE},${SIZE}`,
    "--virtual-time-budget=2500",
    `--screenshot=${source}`,
    `file://${html}`,
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);

try {
  await waitForFile(source, startedAt);
} finally {
  chrome.kill("SIGKILL");
}

const targets = [
  [path.join(appDir, "apple-icon.png"), 180],
  [path.join(publicDir, "web-app-manifest-192x192.png"), 192],
  [path.join(publicDir, "web-app-manifest-512x512.png"), 512],
];

for (const [file, size] of targets) {
  await run("sips", ["-z", String(size), String(size), source, "--out", file]);
}

await unlink(source);

console.log("wrote apple-icon.png and web-app-manifest icons");
