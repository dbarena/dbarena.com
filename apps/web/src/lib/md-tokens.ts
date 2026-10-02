import type { Token, Tokens } from "marked";

import type { MethodInline } from "@/lib/methodology-doc";

const HEADING_ID = /^(.*?)\s*\{#([a-z0-9-]+)\}\s*$/;

export class TokenWalker {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  done() {
    return this.peek() == null;
  }

  peek(offset = 0) {
    let seen = 0;
    for (let i = this.index; i < this.tokens.length; i++) {
      const token = this.tokens[i]!;
      if (token.type === "space" || token.type === "html") continue;
      if (seen === offset) return token;
      seen += 1;
    }
    return undefined;
  }

  take() {
    this.skipNoise();
    return this.tokens[this.index++];
  }

  skipNoise() {
    while (this.index < this.tokens.length) {
      const token = this.tokens[this.index];
      if (token?.type === "space" || token?.type === "html") {
        this.index += 1;
        continue;
      }
      break;
    }
  }
}

export function paragraphInlines(token: Token): MethodInline[] {
  if ("tokens" in token && Array.isArray(token.tokens)) {
    return toInlines(token.tokens);
  }
  if ("text" in token && typeof token.text === "string") {
    return [{ type: "text", value: token.text }];
  }
  return [];
}

export function listItemInlines(item: Tokens.ListItem): MethodInline[] {
  const nested: Token[] = [];
  for (const token of item.tokens) {
    if (
      (token.type === "text" || token.type === "paragraph") &&
      "tokens" in token &&
      token.tokens
    ) {
      nested.push(...token.tokens);
    } else {
      nested.push(token);
    }
  }
  return toInlines(nested);
}

export function toInlines(tokens: Token[] | undefined): MethodInline[] {
  if (!tokens) return [];
  const result: MethodInline[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case "text":
        if ("tokens" in token && token.tokens?.length) {
          result.push(...toInlines(token.tokens));
        } else {
          result.push({ type: "text", value: token.text });
        }
        break;
      case "strong":
        result.push({ type: "strong", children: toInlines(token.tokens) });
        break;
      case "em":
        result.push({ type: "em", children: toInlines(token.tokens) });
        break;
      case "codespan":
        result.push({ type: "code", value: token.text });
        break;
      case "link":
        result.push({
          type: "link",
          href: token.href,
          children: toInlines(token.tokens),
        });
        break;
      case "escape":
        result.push({ type: "text", value: token.text });
        break;
      case "br":
        result.push({ type: "text", value: " " });
        break;
      default:
        if ("text" in token && typeof token.text === "string") {
          result.push({ type: "text", value: token.text });
        }
        break;
    }
  }
  return result;
}

export function asFormula(inlines: MethodInline[]): string | null {
  const significant = inlines.filter(
    (inline) => inline.type !== "text" || inline.value.trim(),
  );
  if (significant.length === 1 && significant[0]?.type === "code") {
    return significant[0].value;
  }
  return null;
}

export function firstStrongText(inlines: MethodInline[]): string | null {
  for (const inline of inlines) {
    if (inline.type === "text" && !inline.value.trim()) continue;
    if (inline.type === "strong") return plainText(inline.children);
    return null;
  }
  return null;
}

export function plainText(inlines: MethodInline[]): string {
  return inlines
    .map((inline) => {
      switch (inline.type) {
        case "text":
        case "code":
          return inline.value;
        case "strong":
        case "em":
        case "link":
          return plainText(inline.children);
        default: {
          const _exhaustive: never = inline;
          return _exhaustive;
        }
      }
    })
    .join("");
}

export function parseHeading(text: string) {
  const match = text.trim().match(HEADING_ID);
  if (match) return { id: match[2], title: match[1]!.trim() };
  return { id: undefined, title: text.trim() };
}

export function navLabelFromId(id: string) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
