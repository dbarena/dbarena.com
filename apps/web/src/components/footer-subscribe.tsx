"use client";

import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SUBSCRIBE_PARAM } from "@/lib/site-links";
import { textLinkClass } from "@/lib/utils";

import { SubscribeDialogCard } from "./subscribe-dialog";
import { useFooterSubscribe } from "./use-footer-subscribe";

function SubscribeNote({ children }: { children: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <p
      aria-live="polite"
      className="text-[13px] text-muted-foreground"
      ref={ref}
      tabIndex={-1}
    >
      {children}
    </p>
  );
}

export function FooterSubscribe({
  autoOpen = false,
  onOpenChange,
}: {
  autoOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { fields, setField, status, submit } = useFooterSubscribe();
  const [open, setOpen] = useState(autoOpen);
  const [autoOpened, setAutoOpened] = useState(autoOpen);

  // autoOpen can turn true after hydration; open once, then leave it to the user.
  if (autoOpen && !autoOpened) {
    setAutoOpened(true);
    setOpen(true);
  }

  useEffect(() => {
    if (!autoOpened) return;
    // Drop ?subscribe so a refresh or a copied URL doesn't reopen the dialog.
    const url = new URL(window.location.href);
    if (!url.searchParams.has(SUBSCRIBE_PARAM)) return;
    url.searchParams.delete(SUBSCRIBE_PARAM);
    window.history.replaceState(window.history.state, "", url);
  }, [autoOpened]);

  function handleOpenChange(next: boolean) {
    if (status === "submitting") return;
    setOpen(next);
    if (status !== "success") onOpenChange?.(next);
  }

  return (
    <div className="w-full min-w-0 sm:w-auto sm:shrink-0 sm:text-right">
      {status === "success" ? (
        <SubscribeNote>You are signed up. New results go to your inbox.</SubscribeNote>
      ) : (
        <Dialog onOpenChange={handleOpenChange} open={open}>
          <DialogTrigger className={textLinkClass}>Get new results</DialogTrigger>
          <DialogHeader className="sr-only">
            <DialogTitle>Get new results</DialogTitle>
            <DialogDescription>
              Get an email when new benchmarks are published.
            </DialogDescription>
          </DialogHeader>
          <DialogContent
            className="max-w-[28rem] overflow-hidden rounded-xl! border-0 bg-transparent p-0 shadow-none ring-0"
            overlayClassName="bg-black/30 supports-backdrop-filter:backdrop-blur-[2px]"
            showCloseButton={false}
          >
            <SubscribeDialogCard
              fields={fields}
              onFieldChange={setField}
              onSubmit={submit}
              status={status}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
