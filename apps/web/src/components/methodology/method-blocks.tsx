import { isColumnProvider } from "@/lib/catalog";
import type { MethodBlock, MethodInline } from "@/lib/methodology-doc";
import { ProviderLogo } from "@/components/provider-logo";
import { cn } from "@/lib/utils";

import { MethodInlines } from "./method-inlines";
import { MethodTable } from "./method-table";
import { Callout, CodeBlock, PROSE_CLASS, Prose, ProseList, SubHeading } from "./method-ui";

export function MethodBlocks({ blocks }: { blocks: MethodBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <MethodBlockView
          block={block}
          key={index}
          tight={block.type === "paragraph" && blocks[index - 1]?.type === "subheading"}
        />
      ))}
    </>
  );
}

function MethodBlockView({
  block,
  tight,
}: {
  block: MethodBlock;
  tight: boolean;
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <Prose className={tight ? "-mt-3" : undefined}>
          <MethodInlines inlines={block.inlines} />
        </Prose>
      );
    case "formula":
      return (
        <p className="mt-3 w-fit rounded-md bg-muted px-3 py-2 font-mono text-[13px] tracking-tight text-foreground">
          {block.value}
        </p>
      );
    case "code":
      return <CodeBlock>{block.value}</CodeBlock>;
    case "subheading":
      return <SubHeading>{block.text}</SubHeading>;
    case "list":
      return block.providers ? (
        <ul className="flex max-w-[38rem] flex-col gap-2.5">
          {block.items.map((item, index) => (
            <li
              className="flex items-start gap-3 text-[15px] leading-[1.65]"
              key={index}
            >
              {item.provider && isColumnProvider(item.provider) ? (
                <ProviderLogo className="mt-1 size-4 shrink-0" provider={item.provider} />
              ) : null}
              <span className="text-foreground/85">
                <MethodInlines inlines={item.inlines} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ProseList>
          {block.items.map((item, index) => (
            <li key={index}>
              <MethodInlines inlines={item.inlines} />
            </li>
          ))}
        </ProseList>
      );
    case "table":
      return (
        <MethodTable
          caption={block.caption}
          columns={block.columns}
          grouped={block.grouped}
          groups={block.groups}
        />
      );
    case "callout":
      return (
        <Callout label={block.label} tone={block.tone}>
          {block.paragraphs.map((inlines, index) => (
            <p key={index}>
              <MethodInlines inlines={inlines} />
            </p>
          ))}
        </Callout>
      );
    case "boundGrid":
      return (
        <div className="grid max-w-[52rem] gap-8 md:grid-cols-2">
          {block.items.map((item) => (
            <article key={item.title}>
              <h4 className="text-[15px] font-medium tracking-tight">{item.title}</h4>
              {item.formula ? (
                <p className="mt-3 w-fit rounded-md bg-muted px-3 py-2 font-mono text-[13px] tracking-tight text-foreground">
                  {item.formula}
                </p>
              ) : null}
              {item.paragraphs.map((inlines, index) => (
                <p
                  className="mt-3 text-[14px] leading-relaxed text-foreground/85"
                  key={index}
                >
                  <MethodInlines inlines={inlines} />
                </p>
              ))}
            </article>
          ))}
        </div>
      );
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function MethodProse({
  className,
  inlines,
}: {
  className?: string;
  inlines: MethodInline[];
}) {
  return (
    <p className={cn(PROSE_CLASS, className)}>
      <MethodInlines inlines={inlines} />
    </p>
  );
}
