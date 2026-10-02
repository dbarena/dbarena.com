/**
 * Prose sits on the page now (P4 "Framed figure"): the panel only wraps each
 * chapter's interactive figure, so the chapter itself carries a plain
 * full-width hairline to mark where the next one begins.
 */
const sectionScrollMt =
  "scroll-mt-[calc(var(--site-header-h)+var(--method-jump-h)+24px)]";

export const chapterClass =
  `${sectionScrollMt} border-t border-border py-10 md:py-16 [&_a]:focus-visible:rounded-sm [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-ring`;

/** Same rhythm and hairline as `chapterClass`, for the shorter measure that
    fits editorial prose (Behind the results, FAQ) rather than a data
    chapter. */
export const editorialSectionClass = `${sectionScrollMt} border-t border-border py-10 md:py-16`;

/** Padding for the figure inside its own `Panel` — the interactive part of a
    chapter (list, matrix, bars), never the chapter's prose. */
export const figurePanelClass = "home-panel-frost min-w-0 p-4 md:p-5 @container";

/** Shared left/right for every homepage section inside the jump-nav
    column. Same tracks and gap so Side project, Heavy load, FAQ, and
    Behind the results share one column start. */
export const splitGridClass =
  "grid grid-cols-[minmax(15rem,.72fr)_minmax(0,1.28fr)] items-start gap-10 [&>*]:min-w-0 lg:gap-16 max-[1199px]:gap-10 max-md:grid-cols-1 max-md:gap-6";

export const kickerClass = "font-mono text-note leading-[1.6] text-muted-foreground";

export const chapterTitleClass =
  "mt-3 text-[length:var(--text-section)] leading-[var(--text-section--line-height)] font-medium tracking-[-0.035em]";

export const proseClass = "text-body leading-[1.7] text-[color:var(--reading-color)]";

export const footnoteClass = "mt-4 block text-note leading-[1.65] text-muted-foreground";

export const providerIdentityClass = "inline-flex items-center gap-2.5 text-caption [&>*]:shrink-0";

/** Enlarge the tap target without pushing the underline away from the label. */
export const ruleTabHitClass =
  "relative after:absolute after:-inset-x-1.5 after:-top-2 after:-bottom-2 after:content-['']";
