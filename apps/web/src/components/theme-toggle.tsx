"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const subscribeNoop = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // The server cannot know the stored theme, so the first render (server and
  // hydrating client alike) uses a neutral label and swaps once mounted.
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const dark = hydrated && resolvedTheme === "dark";
  const label = hydrated
    ? dark
      ? "Switch to light theme"
      : "Switch to dark theme"
    : "Toggle color theme";

  return (
    <button
      aria-label={label}
      aria-pressed={hydrated ? dark : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center outline-none transition-[color,background-color] duration-fast ease-exit focus-visible:ring-2 focus-visible:ring-ring fine-hover:text-foreground",
        className,
      )}
      onClick={() => setTheme(dark ? "light" : "dark")}
      title={label}
      type="button"
    >
      <span className="relative grid size-4 place-items-center">
        {hydrated ? (
          <>
            <SunIcon
              aria-hidden="true"
              className={cn(
                "absolute size-4 transition-opacity duration-fast ease-exit",
                dark ? "opacity-100" : "opacity-0",
              )}
            />
            <MoonIcon
              aria-hidden="true"
              className={cn(
                "absolute size-4 transition-opacity duration-fast ease-exit",
                dark ? "opacity-0" : "opacity-100",
              )}
            />
          </>
        ) : (
          <>
            <MoonIcon aria-hidden="true" className="size-4 dark:hidden" />
            <SunIcon aria-hidden="true" className="hidden size-4 dark:block" />
          </>
        )}
      </span>
    </button>
  );
}
