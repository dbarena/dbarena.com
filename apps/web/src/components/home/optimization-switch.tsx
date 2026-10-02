"use client";

import { Info } from "lucide-react";
import { useRef } from "react";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  diskVariantName,
  diskVariantShortName,
  type DiskVariant,
} from "@/lib/comparison-variants";

import { ruleTabHitClass } from "./home-layout";
import { useActiveMarker } from "./ui/use-active-marker";
import {
  OPTIMIZATION_OPTIONS,
  optimizationExplainerLead,
  optimizationExplainerTitle,
  optimizationFact,
} from "./optimization-pair";

const tabBase =
  `border-0 bg-transparent p-0 pb-[3px] text-caption leading-[1.25] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring fine-hover:text-foreground ${ruleTabHitClass}`;

export function OptimizationSwitch({
  onSelect,
  value,
}: {
  onSelect: (variant: DiskVariant) => void;
  value: DiskVariant;
}) {
  const group = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  useActiveMarker(group, marker, { dependency: value });
  return (
    <div
      aria-label="I/O setup"
      className="relative flex flex-nowrap items-baseline gap-x-3.5 gap-y-1 @max-[42.5rem]:min-w-0 @max-[42.5rem]:grow"
      ref={group}
      role="group"
    >
      <span aria-hidden="true" className="tab-marker" ref={marker} />
      <OptimizationInfo />
      {OPTIMIZATION_OPTIONS.map((option) => (
        <button
          aria-label={diskVariantName(option)}
          aria-pressed={option === value}
          className={`${tabBase} border-b border-solid border-transparent aria-pressed:border-foreground aria-pressed:text-foreground`}
          key={option}
          onClick={() => onSelect(option)}
          type="button"
        >
          {diskVariantShortName(option)}
        </button>
      ))}
    </div>
  );
}

export function OptimizationInfo() {
  const title = optimizationExplainerTitle();
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            aria-label={`${title}. ${optimizationExplainerLead()}`}
            className={`${tabBase} inline-flex items-center gap-1 aria-expanded:text-foreground`}
            type="button"
          />
        }
      >
        I/O
        <Info aria-hidden="true" className="text-muted-foreground" size={11} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] gap-2 p-3.5" side="bottom" sideOffset={8}>
        <PopoverHeader>
          <PopoverTitle className="text-[13px] tracking-tight">{title}</PopoverTitle>
          <PopoverDescription className="text-[13px] leading-snug">
            {optimizationExplainerLead()}
          </PopoverDescription>
        </PopoverHeader>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[13px]/[1.45] text-muted-foreground [&_li]:flex [&_li]:flex-col [&_li]:gap-0.5 [&_strong]:font-medium [&_strong]:text-popover-foreground">
          {OPTIMIZATION_OPTIONS.map((option) => (
            <li key={option}>
              <strong>{diskVariantName(option)}</strong>
              <span>{optimizationFact(option)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
