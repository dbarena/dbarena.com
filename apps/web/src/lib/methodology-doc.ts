import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseMethodology } from "@/lib/parse-methodology";

export type MethodInline =
  | { type: "text"; value: string }
  | { type: "strong"; children: MethodInline[] }
  | { type: "em"; children: MethodInline[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: MethodInline[] };

export type MethodListItem = {
  inlines: MethodInline[];
  provider: string | null;
};

export type MethodTableColumn = {
  align: "left" | "right";
  header: string;
  hideBelow?: "sm";
  key: string;
  mono: boolean;
  muted: boolean;
  spanGroup: boolean;
};

export type MethodTableGroup = {
  comment: string;
  label: string;
  rows: string[][];
};

export type MethodBlock =
  | { type: "paragraph"; inlines: MethodInline[] }
  | { type: "formula"; value: string }
  | { type: "code"; value: string; lang?: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: MethodListItem[]; providers: boolean }
  | {
      type: "table";
      caption: string;
      columns: MethodTableColumn[];
      grouped: boolean;
      groups: MethodTableGroup[];
    }
  | {
      type: "callout";
      label: string;
      paragraphs: MethodInline[][];
      tone: "note" | "caveat";
    }
  | {
      type: "boundGrid";
      items: Array<{
        formula: string | null;
        paragraphs: MethodInline[][];
        title: string;
      }>;
    };

export type MethodSection = {
  blocks: MethodBlock[];
  id: string;
  navLabel: string;
  title: string;
};

export type MethodologyDoc = {
  lede: MethodInline[];
  protocolFacts: Array<{ label: string; value: string }>;
  protocolKicker: string;
  sections: MethodSection[];
  title: string;
};

const METHODOLOGY_PATH = path.join(process.cwd(), "content/methodology.md");

export const getMethodologyDoc = cache(async function getMethodologyDoc() {
  const source = await readFile(METHODOLOGY_PATH, "utf8");
  return parseMethodology(source);
});
