import type { MethodInline } from "@/lib/methodology-doc";
import { cn, textLinkClass } from "@/lib/utils";
import { Mono } from "@/components/methodology/method-ui";

export function MethodInlines({ inlines }: { inlines: MethodInline[] }) {
  return (
    <>
      {inlines.map((inline, index) => (
        <MethodInlineView inline={inline} key={index} />
      ))}
    </>
  );
}

function MethodInlineView({ inline }: { inline: MethodInline }) {
  switch (inline.type) {
    case "text":
      return inline.value;
    case "code":
      return <Mono>{inline.value}</Mono>;
    case "strong":
      return (
        <span className="font-medium text-foreground">
          <MethodInlines inlines={inline.children} />
        </span>
      );
    case "em":
      return (
        <em>
          <MethodInlines inlines={inline.children} />
        </em>
      );
    case "link": {
      const external = /^https?:\/\//.test(inline.href);
      return (
        <a
          className={cn(textLinkClass, "underline-offset-[5px]")}
          href={inline.href}
          rel={external ? "noreferrer" : undefined}
          target={external ? "_blank" : undefined}
        >
          <MethodInlines inlines={inline.children} />
        </a>
      );
    }
    default: {
      const _exhaustive: never = inline;
      return _exhaustive;
    }
  }
}
