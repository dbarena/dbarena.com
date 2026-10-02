import { FooterSubscribeSlot } from "@/components/footer-subscribe-slot";
import { SPONSOR_SIGNUP_HREF } from "@/lib/site-links";
import { textLinkClass } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer
      className="border-t border-border px-page py-5 text-[13px] leading-relaxed text-muted-foreground"
      data-slot="site-footer"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-x-6">
        <p className="min-w-0 flex-1">
          DBARENA is sponsored by{" "}
          <a className={textLinkClass} href={SPONSOR_SIGNUP_HREF}>
            Supabase
          </a>
          . That is ownership, not a claim of independence.
        </p>
        <FooterSubscribeSlot />
      </div>
    </footer>
  );
}
