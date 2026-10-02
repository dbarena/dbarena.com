import { DbarenaMark } from "@/components/dbarena-mark";
import { SiteHeaderNav, SiteHomeLink } from "@/components/site-header-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  COMPARE_HREF,
  GITHUB_HREF,
  SPONSOR_SIGNUP_HREF,
} from "@/lib/site-links";
import { cn } from "@/lib/utils";

const navLinkClass =
  "inline-flex h-11 shrink-0 items-center rounded-md px-2.5 text-[13px] font-medium outline-none transition-[color,background-color] duration-fast ease-exit focus-visible:ring-2 focus-visible:ring-ring bar:h-10";

export function SiteHeader({ compareHref = COMPARE_HREF }: { compareHref?: string }) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-background/90 px-page backdrop-blur-md"
      data-slot="site-header"
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 pt-[max(0.25rem,env(safe-area-inset-top))] bar:flex bar:h-14 bar:gap-1 bar:pt-0">
        <SiteHomeLink>
          <DbarenaMark className="h-5 text-cobalt bar:h-6" />
        </SiteHomeLink>
        <SiteHeaderNav compareHref={compareHref} />
        <div className="col-start-3 row-start-1 ml-auto flex shrink-0 items-center gap-0.5">
          <a
            className={cn(
              navLinkClass,
              "hidden text-muted-foreground bar:inline-flex fine-hover:text-foreground",
            )}
            href={GITHUB_HREF}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            aria-label="Hosted by Supabase (opens in a new tab)"
            className={cn(
              navLinkClass,
              "px-0 whitespace-nowrap text-muted-foreground sm:px-2.5 fine-hover:text-foreground",
            )}
            href={SPONSOR_SIGNUP_HREF}
            rel="noreferrer"
            target="_blank"
          >
            <span className="max-compact:hidden">Hosted by&nbsp;</span>
            <span className="text-foreground max-compact:hidden" translate="no">Supabase</span>
            <span className="hidden text-foreground max-compact:inline">Sponsor</span>
          </a>
          <ThemeToggle className="size-11 rounded-md text-muted-foreground shadow-none bar:size-10" />
        </div>
      </div>
    </header>
  );
}
