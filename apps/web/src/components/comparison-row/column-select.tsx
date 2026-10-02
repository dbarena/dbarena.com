"use client";

import { useId } from "react";
import { Select } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

export type ColumnSelectOption = {
  value: string;
  label: string;
  description?: string;
  price?: string;
  disabledReason?: string;
};

export function ColumnSelect({ label, title, context, value, options, onValueChange }: {
  label: string;
  title: string;
  context: string;
  value: string;
  options: ColumnSelectOption[];
  onValueChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <Select.Root
      items={options}
      onValueChange={(next) => {
        if (next !== null && options.some((option) => option.value === next && !option.disabledReason)) {
          onValueChange(next);
        }
      }}
      value={value}
    >
      <Select.Trigger
        aria-label={label}
        className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-sm px-1.5 text-left text-[12px] text-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-muted/60 md:min-h-7"
      >
        <Select.Value className="min-w-0" />
        <Select.Icon><ChevronDownIcon aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner align="start" alignItemWithTrigger={false} className="isolate z-50" sideOffset={6}>
          <Select.Popup className="ui-popover flex max-h-[min(28rem,var(--available-height))] w-80 max-w-[calc(100vw-1.5rem)] origin-(--transform-origin) flex-col overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none">
            <div className="shrink-0 border-b border-border/70 px-3 py-2.5">
              <p className="text-[13px] font-medium">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{context}</p>
            </div>
            <Select.List aria-label={title} className="min-h-0 overflow-y-auto overscroll-contain p-1">
              {options.map((option, index) => (
                <Select.Item
                  aria-describedby={`${id}-${index}-description ${id}-${index}-price`}
                  className="cursor-pointer rounded-sm px-2.5 py-2.5 outline-none data-highlighted:bg-muted data-disabled:cursor-default data-disabled:opacity-50"
                  disabled={Boolean(option.disabledReason)}
                  key={option.value}
                  label={option.label}
                  value={option.value}
                >
                  <div className="flex items-center gap-2">
                    <Select.ItemText className="min-w-0 flex-1 text-[13px] font-medium">{option.label}</Select.ItemText>
                    <span className="shrink-0 font-mono text-xs tabular-nums" id={`${id}-${index}-price`}>{option.price}</span>
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      <Select.ItemIndicator><CheckIcon aria-hidden="true" className="size-3.5" /></Select.ItemIndicator>
                    </span>
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-muted-foreground" id={`${id}-${index}-description`}>
                    {option.description ? <p>{option.description}</p> : null}
                    {option.disabledReason ? <p className="mt-0.5">{option.disabledReason}</p> : null}
                  </div>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
