import type { Token, Tokens } from "marked";
import { marked } from "marked";

import { isColumnProvider, PROVIDER_NAMES } from "@/lib/catalog";
import type {
  MethodBlock,
  MethodListItem,
  MethodSection,
  MethodTableColumn,
  MethodTableGroup,
  MethodologyDoc,
} from "@/lib/methodology-doc";
import {
  asFormula,
  firstStrongText,
  listItemInlines,
  navLabelFromId,
  paragraphInlines,
  parseHeading,
  plainText,
  slugify,
  TokenWalker,
} from "@/lib/md-tokens";

const ALERT_LINE = /^\[!(NOTE|CAVEAT|WARNING|CAUTION)\]\s*(.*?)\s*$/i;
const EMPTY_CELL = /^(?:—|–)$/;

marked.setOptions({ gfm: true });

export function parseMethodology(markdown: string): MethodologyDoc {
  const walker = new TokenWalker(marked.lexer(markdown));

  const titleToken = walker.take();
  if (titleToken?.type !== "heading" || titleToken.depth !== 1) {
    throw new Error("methodology.md must start with an # heading");
  }

  const title = parseHeading(titleToken.text).title;
  const lede =
    walker.peek()?.type === "paragraph" ? paragraphInlines(walker.take()!) : [];

  let protocolKicker = "Every published run";
  if (walker.peek()?.type === "paragraph" && walker.peek(1)?.type === "table") {
    protocolKicker = plainText(paragraphInlines(walker.take()!));
  }

  const protocolFacts: MethodologyDoc["protocolFacts"] = [];
  if (walker.peek()?.type === "table") {
    const table = walker.take() as Tokens.Table;
    for (const row of tableCells(table).rows) {
      if (row.length >= 2) {
        protocolFacts.push({ label: row[0]!.trim(), value: row[1]!.trim() });
      }
    }
  }

  const sections: MethodSection[] = [];
  while (!walker.done()) {
    const token = walker.take();
    if (!token) break;
    if (token.type !== "heading" || token.depth !== 2) {
      throw new Error(
        `methodology.md: expected a ## section heading, got ${token.type}`,
      );
    }
    const heading = parseHeading(token.text);
    const id = heading.id ?? slugify(heading.title);
    sections.push({
      blocks: parseSectionBlocks(walker),
      id,
      navLabel: navLabelFromId(id),
      title: heading.title,
    });
  }

  return { lede, protocolFacts, protocolKicker, sections, title };
}

export function displayTableCell(value: string) {
  return EMPTY_CELL.test(value) ? "Not offered" : value;
}

export function parseClientSweep(value: string) {
  const counts = value.split(",").map((part) => Number(part.trim()));
  if (counts.length < 2 || counts.some((count) => !Number.isInteger(count) || count <= 0)) {
    return null;
  }
  return counts;
}

function isClientHeader(header: string) {
  const key = header.toLowerCase();
  return key === "clients" || key === "client sweep";
}

function parseSectionBlocks(walker: TokenWalker): MethodBlock[] {
  const blocks: MethodBlock[] = [];
  const bound: Array<{
    formula: string | null;
    paragraphs: ReturnType<typeof paragraphInlines>[];
    title: string;
  }> = [];

  const flushBound = () => {
    if (bound.length === 0) return;
    blocks.push({ type: "boundGrid", items: bound.splice(0) });
  };

  while (!walker.done()) {
    const next = walker.peek();
    if (!next) break;
    if (next.type === "heading" && next.depth <= 2) break;

    const token = walker.take()!;

    if (token.type === "heading" && token.depth === 3) {
      flushBound();
      blocks.push({ type: "subheading", text: parseHeading(token.text).title });
      continue;
    }

    if (token.type === "heading" && token.depth === 4) {
      const title = parseHeading(token.text).title;
      const article = collectUntilHeading(walker, 4);
      let formula: string | null = null;
      const paragraphs: ReturnType<typeof paragraphInlines>[] = [];
      for (const block of article) {
        if (block.type === "formula" && formula == null) formula = block.value;
        else if (block.type === "paragraph") paragraphs.push(block.inlines);
      }
      bound.push({ formula, paragraphs, title });
      continue;
    }

    flushBound();
    const block = tokenToBlock(token);
    if (block) blocks.push(block);
  }

  flushBound();
  return blocks;
}

function collectUntilHeading(walker: TokenWalker, minDepth: number): MethodBlock[] {
  const blocks: MethodBlock[] = [];
  while (!walker.done()) {
    const next = walker.peek();
    if (!next) break;
    if (next.type === "heading" && next.depth <= minDepth) break;
    if (next.type === "hr") break;
    if (next.type === "table" || next.type === "list" || next.type === "blockquote") break;
    const block = tokenToBlock(walker.take()!);
    if (block) blocks.push(block);
  }
  return blocks;
}

function tokenToBlock(token: Token): MethodBlock | null {
  switch (token.type) {
    case "paragraph": {
      const inlines = paragraphInlines(token);
      const formula = asFormula(inlines);
      return formula
        ? { type: "formula", value: formula }
        : { type: "paragraph", inlines };
    }
    case "list":
      return parseList(token as Tokens.List);
    case "table":
      return parseTable(token as Tokens.Table);
    case "blockquote":
      return parseCallout(token as Tokens.Blockquote);
    case "code": {
      const code = token as Tokens.Code;
      return { type: "code", value: code.text, lang: code.lang || undefined };
    }
    case "heading":
    case "hr":
      return null;
    default: {
      if ("text" in token && typeof token.text === "string" && token.text.trim()) {
        return {
          type: "paragraph",
          inlines: [{ type: "text", value: token.text }],
        };
      }
      return null;
    }
  }
}

function parseList(token: Tokens.List): MethodBlock {
  const items: MethodListItem[] = token.items.map((item) => {
    const inlines = listItemInlines(item);
    return { inlines, provider: matchProvider(firstStrongText(inlines)) };
  });
  return {
    type: "list",
    items,
    providers: items.length > 0 && items.every((item) => item.provider != null),
  };
}

function parseTable(token: Tokens.Table): MethodBlock {
  const { headers, rows } = tableCells(token);
  const commentIndex = headers.findIndex(
    (header) => header.toLowerCase() === "comment",
  );
  const grouped = rows.some(
    (row, index) => index > 0 && row[0]?.trim() === rows[index - 1]?.[0]?.trim(),
  );
  const hideComment = grouped && commentIndex >= 0;
  const visibleIndexes = headers
    .map((_, index) => index)
    .filter((index) => !(hideComment && index === commentIndex));

  const columns: MethodTableColumn[] = visibleIndexes.map((index) => {
    const header = headers[index]!;
    const key = header.toLowerCase();
    const cores = key === "cores" || key === "cpu cores";
    const clients = isClientHeader(header);
    const right = key === "vcpu" || key === "ram" || cores || key === "warehouses" || clients;
    return {
      align: right ? "right" : "left",
      header,
      hideBelow: grouped && (cores || key === "ram") ? "sm" : undefined,
      key: `${slugify(header) || "col"}-${index}`,
      mono: right || clients || key === "region" || key.includes("instance"),
      muted: key === "comment",
      spanGroup: index === 0 || cores || key === "ram" || clients,
    };
  });

  const groups: MethodTableGroup[] = [];
  for (const row of rows) {
    const label = (row[0] ?? "").trim();
    const comment =
      hideComment && commentIndex >= 0 ? (row[commentIndex] ?? "").trim() : "";
    const cells = visibleIndexes.map((index) =>
      index === 0 ? label : (row[index] ?? "").trim(),
    );
    const last = groups.at(-1);
    if (grouped && last?.label === label) {
      last.rows.push(cells);
      if (!last.comment && comment) last.comment = comment;
    } else {
      groups.push({ comment, label, rows: [cells] });
    }
  }

  return {
    type: "table",
    caption: headers.join(", "),
    columns,
    grouped,
    groups,
  };
}

function parseCallout(token: Tokens.Blockquote): MethodBlock {
  const parts = token.tokens.filter((part) => part.type !== "space");
  let tone: "note" | "caveat" = "note";
  let label = "";
  let start = 0;

  const first = parts[0];
  const firstText = first && "text" in first ? String(first.text) : "";
  const alert = firstText.split("\n")[0]?.trim().match(ALERT_LINE);
  if (alert) {
    tone = alert[1]!.toUpperCase() === "NOTE" ? "note" : "caveat";
    label = alert[2]!.trim();
    start = 1;
  } else if (first) {
    const strong = firstStrongText(paragraphInlines(first));
    if (strong) {
      label = strong;
      start = 1;
    }
  }

  if (!label && parts[start]) {
    const strong = firstStrongText(paragraphInlines(parts[start]!));
    if (strong) {
      label = strong;
      start += 1;
    }
  }

  return {
    type: "callout",
    label: label || "Note",
    paragraphs: parts.slice(start).map(paragraphInlines).filter((p) => p.length > 0),
    tone,
  };
}

function tableCells(token: Tokens.Table) {
  return {
    headers: token.header.map((cell) => cell.text.trim()),
    rows: token.rows.map((row) => row.map((cell) => cell.text.trim())),
  };
}

function matchProvider(lead: string | null): string | null {
  if (!lead) return null;
  const lower = lead.toLowerCase();
  for (const [id, name] of Object.entries(PROVIDER_NAMES)) {
    if (isColumnProvider(id) && lower.includes(name.toLowerCase())) return id;
  }
  return null;
}
