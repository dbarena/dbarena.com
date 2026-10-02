import {
  TIER_OPTIONS,
  type BoundType,
  type ColumnTier,
} from "@/lib/catalog";

export const LOAD_INTENTS: BoundType[] = ["cache-fit", "cache-exceeding"];

export function instanceSpecFor(tier: ColumnTier) {
  const option = TIER_OPTIONS.find((entry) => entry.id === tier);
  if (!option) return "—";
  return `${option.compute} · ${option.memory}`;
}

export function situationFor(tier: ColumnTier) {
  switch (tier) {
    case "small":
      return {
        title: "Side project",
        hint: "Prototypes and first deploys",
      };
    case "medium":
      return {
        title: "Growing side project",
        hint: "More data, same two vCPU",
      };
    case "large":
      return {
        title: "Typical app",
        hint: "A live app with real traffic",
      };
    case "xlarge":
      return {
        title: "Growing product",
        hint: "Traffic still climbing",
      };
    case "2xlarge":
      return {
        title: "Busy production",
        hint: "Many connections, steady load",
      };
    case "4xlarge":
      return {
        title: "Scaling production",
        hint: "Sustained load through the day",
      };
    case "8xlarge":
      return {
        title: "Heavy load",
        hint: "High throughput, large working set",
      };
    default: {
      const exhaustive: never = tier;
      return exhaustive;
    }
  }
}
