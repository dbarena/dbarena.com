"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { COMPARE_HREF, HOME_HREF, METHODOLOGY_HREF } from "@/lib/site-links";
import { cn } from "@/lib/utils";

const navLinkClass =
  "inline-flex h-11 shrink-0 items-center rounded-md px-2.5 text-[13px] font-medium outline-none transition-[color,background-color] duration-fast ease-exit focus-visible:ring-2 focus-visible:ring-ring bar:h-10";

function NavLink({
  children,
  current,
  href,
}: {
  children: string;
  current: boolean;
  href: string;
}) {
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className={cn(
        navLinkClass,
        current
          ? "text-foreground"
          : "text-muted-foreground fine-hover:bg-muted/60 fine-hover:text-foreground",
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

export function SiteHomeLink({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onHome = pathname === HOME_HREF;

  return (
    <Link
      aria-current={onHome ? "page" : undefined}
      aria-label="DBARENA home"
      className="col-start-1 row-start-1 mr-2 inline-flex h-11 shrink-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring bar:h-10"
      href={HOME_HREF}
    >
      {children}
    </Link>
  );
}

export function SiteHeaderNav({ compareHref = COMPARE_HREF }: { compareHref?: string }) {
  const pathname = usePathname();
  const onCompare =
    pathname === COMPARE_HREF || pathname.startsWith(`${COMPARE_HREF}/`);
  const onMethod = pathname === METHODOLOGY_HREF;

  return (
    <nav
      aria-label="Site"
      className="col-span-3 row-start-2 -mx-2.5 flex min-w-0 items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] bar:col-auto bar:row-auto bar:mx-0 bar:pb-0"
    >
      <NavLink current={pathname === HOME_HREF} href={HOME_HREF}>
        Home
      </NavLink>
      <NavLink current={onCompare} href={compareHref}>
        Compare
      </NavLink>
      <NavLink current={onMethod} href={METHODOLOGY_HREF}>
        How we measure
      </NavLink>
    </nav>
  );
}
