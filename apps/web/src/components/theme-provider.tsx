"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";

function ThemeColor() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", getComputedStyle(document.body).backgroundColor);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [resolvedTheme]);
  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeColor />
      {children}
    </NextThemesProvider>
  );
}
