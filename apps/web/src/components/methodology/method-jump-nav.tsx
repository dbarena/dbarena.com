"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type MethodNavSection = { id: string; label: string };

const CLICK_UNLOCK_MS = 120;

export function MethodJumpNav({
  sections,
  layout = "sidebar",
}: {
  sections: MethodNavSection[];
  layout?: "sidebar" | "horizontal";
}) {
  const sidebar = layout === "sidebar";
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const clickLock = useRef(false);
  const unlockTimer = useRef(0);
  const bumpClickLock = useRef<() => void>(() => {});
  const navRef = useRef<HTMLElement>(null);
  const sectionKey = sections.map((section) => section.id).join(" ");

  useEffect(() => {
    const ids = sectionKey.split(" ").filter(Boolean);
    if (ids.length === 0) return;

    const initialHashFrame = window.requestAnimationFrame(() => {
      const hashId = window.location.hash.slice(1);
      if (hashId && ids.includes(hashId)) setActive(hashId);
    });

    let scrollFrame = 0;
    const applyVisible = () => {
      if (clickLock.current) return;
      const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const horizontal = !sidebar || window.innerWidth < 1024;
      const activationLine = horizontal
        ? headerBottom + (navRef.current?.offsetHeight ?? 44) + 32
        : Math.max(headerBottom + 25, window.innerHeight * 0.2);
      let next = ids[0] ?? "";
      for (const id of ids) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= activationLine) next = id;
      }
      const atBottom = window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (atBottom) next = ids.at(-1) ?? next;
      setActive(next);
    };

    const releaseClickLock = () => {
      if (!clickLock.current) return;
      clickLock.current = false;
      window.clearTimeout(unlockTimer.current);
      applyVisible();
    };

    bumpClickLock.current = () => {
      if (!clickLock.current) return;
      window.clearTimeout(unlockTimer.current);
      unlockTimer.current = window.setTimeout(releaseClickLock, CLICK_UNLOCK_MS);
    };

    const onProgrammaticScroll = () => {
      bumpClickLock.current();
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(applyVisible);
    };
    const onHash = () => {
      const match = ids.find((id) => id === window.location.hash.slice(1));
      if (!match) return;
      clickLock.current = true;
      setActive(match);
      bumpClickLock.current();
    };

    window.addEventListener("hashchange", onHash);
    window.addEventListener("scroll", onProgrammaticScroll, { passive: true });
    window.addEventListener("resize", onProgrammaticScroll);
    window.addEventListener("scrollend", releaseClickLock);
    window.addEventListener("wheel", releaseClickLock, { passive: true });
    window.addEventListener("touchstart", releaseClickLock, { passive: true });
    applyVisible();
    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(initialHashFrame);
      window.clearTimeout(unlockTimer.current);
      bumpClickLock.current = () => {};
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("scroll", onProgrammaticScroll);
      window.removeEventListener("resize", onProgrammaticScroll);
      window.removeEventListener("scrollend", releaseClickLock);
      window.removeEventListener("wheel", releaseClickLock);
      window.removeEventListener("touchstart", releaseClickLock);
    };
  }, [sectionKey, sidebar]);

  // On mobile the sections scroll horizontally with the scrollbar hidden, so
  // the only way to see which one is active is to keep it in view ourselves.
  useEffect(() => {
    const container = navRef.current;
    if (!container || (sidebar && window.innerWidth >= 1024)) return;
    const activeLink = container.querySelector<HTMLAnchorElement>(`a[href="#${active}"]`);
    if (!activeLink) return;
    const containerRect = container.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    if (linkRect.left >= containerRect.left && linkRect.right <= containerRect.right) return;
    const overflowLeft = linkRect.left - containerRect.left;
    const overflowRight = linkRect.right - containerRect.right;
    const delta = overflowRight > 0 ? overflowRight + 24 : overflowLeft - 24;
    container.scrollTo({ left: container.scrollLeft + delta, behavior: "smooth" });
  }, [active, sidebar]);

  return (
    <nav
      ref={navRef}
      aria-labelledby="on-this-page-label"
      className={cn(
        "sticky top-[var(--site-header-h)] z-40 -mx-page flex items-center gap-1 overflow-x-auto border-b border-border bg-background/90 px-[calc(var(--spacing-page)-0.625rem)] backdrop-blur-md [scrollbar-width:none]",
        "[mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]",
        sidebar
          ? "lg:mx-0 lg:flex-col lg:items-stretch lg:gap-0.5 lg:self-start lg:border-b-0 lg:bg-transparent lg:px-0 lg:pt-14 lg:backdrop-blur-none lg:[mask-image:none]"
          : "h-11",
      )}
      data-slot="method-jump"
    >
      <p
        className={cn("sr-only pb-2 pl-2.5 text-[12px] font-medium text-muted-foreground", sidebar && "lg:not-sr-only lg:block")}
        id="on-this-page-label"
      >
        On this page
      </p>
      {sections.map((section) => {
        const current = active === section.id;
        return (
          <a
            aria-current={current ? "location" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 items-center rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap outline-none transition-[color,background-color] duration-fast ease-exit focus-visible:ring-2 focus-visible:ring-ring",
              sidebar && "lg:h-9",
              current
                ? sidebar ? "text-foreground lg:bg-muted" : "bg-muted/70 text-foreground"
                : "text-muted-foreground fine-hover:text-foreground fine-hover:bg-muted/50",
            )}
            href={`#${section.id}`}
            key={section.id}
            onClick={() => {
              clickLock.current = true;
              setActive(section.id);
              bumpClickLock.current();
            }}
          >
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}
