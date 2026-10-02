import "./source-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { rankPaint } = await import("../src/components/home/home-evidence.ts");
const theme = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("every rank line has a portable SVG stroke color", () => {
  for (let index = 0; index < 8; index += 1) {
    const color = rankPaint(index).color;
    assert.match(
      color,
      /^(?:#[\da-f]{6}|var\(--[\w-]+\))$/i,
      `rank ${index + 1} uses a color that may disappear as an SVG stroke`,
    );
    if (index >= 2) {
      const token = color.slice(4, -1);
      const definitions = theme.match(new RegExp(`${token}: #[\\da-f]{6};`, "gi")) ?? [];
      assert.equal(definitions.length, 2, `${token} needs light and dark sRGB values`);
    }
  }
});
