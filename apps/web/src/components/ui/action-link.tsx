import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

/** Standalone navigation actions share the same geometry as app buttons. */
export function ActionLink({
  children, className, variant = "outline", size = "default", ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
    {children}<ArrowUpRight aria-hidden="true" data-icon="inline-end" />
  </Link>;
}
