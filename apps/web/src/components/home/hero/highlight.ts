"use client";

import { useState } from "react";

export type ChartHighlight = {
  hovered: string | null;
  pinned: string | null;
  setHovered: (provider: string | null) => void;
  setPinned: (provider: string | null) => void;
};

export function useChartHighlight(): ChartHighlight {
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  return { hovered, pinned, setHovered, setPinned };
}
