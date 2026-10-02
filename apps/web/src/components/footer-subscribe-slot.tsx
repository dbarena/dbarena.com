"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { COMPARE_HREF, SUBSCRIBE_PARAM } from "@/lib/site-links";
import { FooterSubscribe } from "./footer-subscribe";

const subscribeNoop = () => () => {};

function hasSubscribeParam() {
  return new URLSearchParams(window.location.search).has(SUBSCRIBE_PARAM);
}

export function FooterSubscribeSlot() {
  const pathname = usePathname();
  // The server cannot see the query string, so the dialog opens after hydration.
  const requested = useSyncExternalStore(subscribeNoop, hasSubscribeParam, () => false);
  if (pathname === COMPARE_HREF || pathname.startsWith(`${COMPARE_HREF}/`)) return null;
  // Keep the trigger mounted so closing the dialog reliably restores focus.
  return <FooterSubscribe autoOpen={requested} key={pathname} />;
}
