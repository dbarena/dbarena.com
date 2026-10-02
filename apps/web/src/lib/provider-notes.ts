import { cache } from "react";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const NOTES_DIRECTORY = path.join(process.cwd(), "content/notes");

async function loadProviderNotes(): Promise<Record<string, string>> {
  const notes: Record<string, string> = {};
  let entries;

  try {
    entries = await readdir(NOTES_DIRECTORY, { withFileTypes: true });
  } catch {
    return notes;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map(async (entry) => {
        const text = (
          await readFile(path.join(NOTES_DIRECTORY, entry.name), "utf8")
        ).trim();
        if (text) notes[entry.name.replace(/\.md$/, "")] = text;
      }),
  );

  return notes;
}

let cached: Promise<Record<string, string>> | null = null;

export const getProviderNotes = cache(async function getProviderNotes() {
  cached ??= loadProviderNotes();
  return cached;
});
