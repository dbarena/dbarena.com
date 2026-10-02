"use client";

import { StatusScreen } from "@/components/status-screen";
import { textLinkClass } from "@/lib/utils";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusScreen
      action={
        <button className={textLinkClass} onClick={reset} type="button">
          Try again
        </button>
      }
      body="Something failed while loading this page. Try again, or go back to Home."
      title="Could not load this page"
    />
  );
}
