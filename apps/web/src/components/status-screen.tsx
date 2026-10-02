import Link from "next/link";
import type { ReactNode } from "react";

import { HOME_HREF } from "@/lib/site-links";
import { textLinkClass } from "@/lib/utils";

export function StatusScreen({
  action,
  body,
  title,
}: {
  action?: ReactNode;
  body: string;
  title: string;
}) {
  return (
    <main
      className="flex min-h-0 flex-1 flex-col px-page pt-10 pb-16 sm:pt-16"
      id="main"
    >
      <h1 className="max-w-xl text-[2rem] leading-[1.08] font-medium tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      <p className="mt-6">
        {action ?? (
          <Link className={textLinkClass} href={HOME_HREF}>
            Back to Home
          </Link>
        )}
      </p>
    </main>
  );
}
