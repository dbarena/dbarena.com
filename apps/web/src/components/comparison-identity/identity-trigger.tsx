"use client";

import { ChevronDownIcon } from "lucide-react";

import { ProviderIdentity } from "@/components/comparison-identity/provider-identity";
import { type ColumnProvider } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function IdentityTrigger({
  open = false,
  provider,
  tier,
}: {
  open?: boolean;
  provider: ColumnProvider;
  tier: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ProviderIdentity provider={provider} secondary={tier} />
      <ChevronDownIcon
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-exit",
          open && "rotate-180",
        )}
      />
    </span>
  );
}
