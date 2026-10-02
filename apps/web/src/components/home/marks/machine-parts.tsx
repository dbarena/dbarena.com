/** Shared geometry for the decorative compute and protocol illustrations. */
export function Plate({ x = 160, y, width = 152, accent = false, className, leds = true, slot = true }: {
  x?: number; y: number; width?: number; accent?: boolean; className?: string;
  /** The three LEDs on the right side face and the inset slot on the left
      one. On the ranking cards' large plates they are the hardware detail;
      on a 52-wide plate in a stack they read as loose marks, so the stacks
      keep them for the top plate only. */
  leds?: boolean; slot?: boolean;
}) {
  const w = width / 2;
  const h = width / 4;
  return (
    <g className={className} strokeLinejoin="round">
      <path className="machine-side" d={`M${x - w} ${y} l${w} ${h} ${w} -${h} v8 l-${w} ${h} -${w} -${h}Z`} />
      <path className={accent ? "machine-face machine-face-accent" : "machine-face"} d={`M${x} ${y - h} l${w} ${h} -${w} ${h} -${w} -${h}Z`} />
      <path className="machine-edge" d={slot ? `M${x} ${y + h} v8 M${x - w + 9} ${y + 5} l${w - 18} ${h - 9}` : `M${x} ${y + h} v8`} />
      {leds && [0, 1, 2].map((i) => {
        // Three LEDs on the right side face, spaced in from its outer corner.
        // The spacing is fixed on the large plates and shrinks with the plate
        // below 60 wide, so the innermost LED never reaches the front corner
        // and crosses onto the left face. Each sits centred in the 8-tall
        // face, following its slope.
        const inset = w < 30 ? w * 0.3 : 11;
        const step = w < 30 ? w * 0.2 : 7;
        const d = w - inset - i * step;
        const ly = y + (h * (w - d)) / w + 3.5;
        return (
          <path className={accent ? `machine-led machine-led-accent machine-led-${i}` : "machine-led"} d={`M${x + d} ${ly} l-2 1`} key={i} />
        );
      })}
    </g>
  );
}

export function DiagramGuides() {
  return (
    <g className="machine-guides">
      {/* Datum lines at the diamond's two widest elevations, drawn far past the
          viewBox so they run off the drawing sheet in either direction. The
          card's own `overflow: hidden` is what ends them, so they reach the
          card edge at every width and stay locked to the plates at every
          scale. The machine's opaque faces paint over them, which is what
          makes them read as construction lines passing behind the object. */}
      <path className="machine-datum-line" d="M-480 108H800" strokeDasharray="2 5" />
      <path className="machine-datum-line machine-datum-line-low" d="M-480 140H800" strokeDasharray="2 5" />
      <path d="M28 108 160 42 292 108 160 174Z M28 140 160 74 292 140 M60 60 260 160 M60 160 260 60" strokeDasharray="2 5" />
      <path d="M24 105v6m-3-3h6M296 105v6m-3-3h6M157 184h6m-3-3v6" />
    </g>
  );
}
