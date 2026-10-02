"use client";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function HintPopover({
  body,
  className,
  label,
  side = "right",
  title = label,
}: {
  body: string;
  className?: string;
  label: string;
  side?: "right" | "bottom";
  title?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            aria-label={`${label}. ${body}`}
            className={className}
            type="button"
          />
        }
      >
        {label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1 p-3" side={side} sideOffset={8}>
        <PopoverHeader>
          <PopoverTitle className="text-[13px] tracking-tight">{title}</PopoverTitle>
          <PopoverDescription className="text-[13px] leading-snug">
            {body}
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

const hintTriggerClass =
  "-mx-1.5 inline-flex min-h-11 cursor-help items-center rounded-md px-1.5 text-left text-[13px] font-medium tracking-tight text-foreground underline decoration-border decoration-dotted underline-offset-[5px] outline-none transition-[color,text-decoration-color] duration-fast ease-exit focus-visible:ring-2 focus-visible:ring-ring aria-expanded:decoration-foreground fine-hover:decoration-foreground sm:min-h-8";

export function MetricHint({
  className,
  hint,
  label,
  side = "right",
}: {
  className?: string;
  hint: string;
  label: string;
  side?: "right" | "bottom";
}) {
  return (
    <HintPopover
      body={hint}
      className={cn(hintTriggerClass, className)}
      label={label}
      side={side}
    />
  );
}

export function NoteHint({ note }: { note: string }) {
  return (
    <HintPopover
      body={note}
      className="inline-flex min-h-11 cursor-help items-center rounded-sm px-1 text-[12px] text-muted-foreground outline-none transition-colors duration-fast ease-exit focus-visible:ring-2 focus-visible:ring-ring fine-hover:text-foreground sm:min-h-0 sm:px-0"
      label="Note"
      side="bottom"
    />
  );
}
