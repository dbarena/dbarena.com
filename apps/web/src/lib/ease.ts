/** Same curve as `--ease-out` in globals.css. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_OUT_CSS = `cubic-bezier(${EASE_OUT.join(", ")})`;
