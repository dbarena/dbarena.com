import type { ReactNode } from "react";

export type MarkState = { className?: string; done: boolean; playing: boolean };

/** One protocol station's drawing. A 280×100 sheet that the card scales up
    to fill its art area; every station composes to the sheet's centre and
    uses most of its width, with no construction lines under it — these are
    front-on drawings, and ruled lines behind a flat object read as paper,
    not as a datum. */
export function Frame({ children, className, playing, done }: MarkState & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      data-playing={playing || undefined}
      data-done={done || undefined}
      fill="none"
      focusable="false"
      viewBox="0 0 280 100"
    >
      {children}
    </svg>
  );
}
