import { ProviderLogo } from "@/components/provider-logo";
import { providerKind, providerName, type ColumnProvider } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function ProviderIdentity({
  className,
  logoClassName,
  provider,
  secondary,
}: {
  className?: string;
  logoClassName?: string;
  provider: ColumnProvider;
  secondary?: string;
}) {
  const kind = providerKind(provider);
  const meta = [kind, secondary].filter(Boolean).join(" · ");

  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)} title={providerName(provider)}>
      <ProviderLogo
        className={cn("size-5 shrink-0 text-muted-foreground", logoClassName)}
        monochrome
        provider={provider}
      />
      <span className="min-w-0">
        <span
          className="block truncate text-[13px] font-medium leading-tight text-foreground"
          translate="no"
        >
          {providerName(provider)}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </span>
    </span>
  );
}
