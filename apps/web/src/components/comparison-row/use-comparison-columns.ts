"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { interactionScrollBehavior } from "@/components/interaction-mode";

import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  applyMatchedTier,
  availableRotationFrom,
  configurationKey,
  indexCatalog,
  lookupBenchmark,
  occupiedKeys,
  TIER_OPTIONS,
  type BoundType,
  type ColumnIdentity,
  type ColumnProvider,
  type ColumnTier,
} from "@/lib/catalog";
import { writeComparisonSearch } from "@/lib/comparison-url";

export type ResolvedColumn = ColumnIdentity & { benchmark: BenchmarkSummary };

export function useComparisonColumns({
  benchmarks,
  initialBoundType,
  initialColumns,
}: {
  benchmarks: BenchmarkSummary[];
  initialBoundType: BoundType;
  initialColumns: ColumnIdentity[];
}) {
  const [columns, setColumns] = useState<ColumnIdentity[]>(initialColumns);
  const [boundType, setBoundType] = useState<BoundType>(initialBoundType);
  const [lockSizes, setLockSizesState] = useState(
    () => initialColumns.length === 0 || initialColumns.every((column) => column.tier === initialColumns[0]?.tier),
  );
  const nextId = useRef(initialColumns.length + 1);
  const railRef = useRef<HTMLDivElement>(null);
  const pendingScrollId = useRef<string | null>(null);
  const catalog = useMemo(() => indexCatalog(benchmarks), [benchmarks]);

  function commit(nextBound: BoundType, nextColumns: ColumnIdentity[]) {
    setBoundType(nextBound);
    setColumns(nextColumns);
    writeComparisonSearch(nextBound, nextColumns);
  }

  useEffect(() => {
    const id = pendingScrollId.current;
    if (!id) return;
    pendingScrollId.current = null;
    const rail = railRef.current;
    const panel = rail?.querySelector<HTMLElement>(`[data-comparison-id="${id}"]`);
    if (!rail || !panel) return;
    const railScrolls = rail.scrollWidth > rail.clientWidth;
    const edge = railScrolls
      ? rail.getBoundingClientRect().right
      : window.innerWidth;
    const overflow = panel.getBoundingClientRect().right - edge;
    if (overflow <= 0) return;
    const behavior = interactionScrollBehavior();
    if (railScrolls) {
      rail.scrollTo({ left: rail.scrollLeft + overflow + 1, behavior });
    } else {
      window.scrollTo({ left: window.scrollX + overflow + 1, behavior });
    }
  }, [columns]);

  function resolve(
    provider: ColumnProvider,
    tier: ColumnTier,
    variant: string | null | undefined,
    bound: BoundType,
  ) {
    const benchmark = lookupBenchmark(catalog, provider, tier, bound, variant);
    if (!benchmark) return null;
    return {
      provider: benchmark.provider,
      tier: benchmark.tier,
      variant: benchmark.variant,
    };
  }

  function update(
    columnId: string,
    updates: Partial<Pick<ColumnIdentity, "provider" | "tier" | "variant">>,
  ) {
    const target = columns.find((column) => column.id === columnId);
    if (!target) return;
    const requested = { ...target, ...updates };
    const next = resolve(
      requested.provider,
      requested.tier,
      requested.variant,
      boundType,
    );
    if (!next) return;

    // With sizes locked, changing one column's size carries every column
    // along so they stay matched instead of drifting apart.
    if (lockSizes && next.tier !== target.tier) {
      matchSizes(next.tier);
      return;
    }

    const collision = columns.some(
      (column) =>
        column.id !== columnId && configurationKey(column) === configurationKey(next),
    );
    if (collision) return;
    commit(
      boundType,
      columns.map((column) => (column.id === columnId ? { ...column, ...next } : column)),
    );
  }

  function append(
    provider: ColumnProvider,
    tier: ColumnTier,
    variant?: string | null,
  ) {
    const targetTier = lockSizes && columns.length > 0 ? columns[0]!.tier : tier;
    const next = resolve(provider, targetTier, variant, boundType);
    if (!next) return;
    if (occupiedKeys(columns).has(configurationKey(next))) return;
    const column: ColumnIdentity = {
      id: `comparison-${nextId.current}`,
      ...next,
    };
    nextId.current += 1;
    pendingScrollId.current = column.id;
    commit(boundType, [...columns, column]);
  }

  // A pointer drag calls this once, on release; the gesture itself moves
  // columns with transforms and never touches this state.
  function reorder(nextIds: string[]) {
    if (nextIds.length !== columns.length) return;
    const byId = new Map(columns.map((column) => [column.id, column]));
    const next = nextIds.flatMap((id) => {
      const column = byId.get(id);
      return column ? [column] : [];
    });
    if (next.length !== columns.length) return;
    commit(boundType, next);
  }

  function remove(columnId: string) {
    if (columns.length <= 1) return;
    commit(
      boundType,
      columns.filter((column) => column.id !== columnId),
    );
  }

  function changeBoundType(next: BoundType) {
    if (next === boundType) return;
    const kept = columns.flatMap((column) => {
      const resolved = resolve(column.provider, column.tier, column.variant, next);
      return resolved ? [{ ...column, ...resolved }] : [];
    });
    if (kept.length === 0) return;
    commit(next, kept);
  }

  function matchSizes(tier: ColumnTier) {
    const next = applyMatchedTier(columns, tier).flatMap((column) => {
      const resolved = resolve(column.provider, column.tier, column.variant, boundType);
      return resolved ? [{ ...column, ...resolved }] : [];
    });
    if (next.length === 0) return;
    commit(boundType, next);
  }

  function setLockSizes(next: boolean) {
    setLockSizesState(next);
    if (next && columns.length > 0) matchSizes(columns[0]!.tier);
  }

  const resolved: ResolvedColumn[] = columns.flatMap((column) => {
    const benchmark = lookupBenchmark(
      catalog,
      column.provider,
      column.tier,
      boundType,
      column.variant,
    );
    return benchmark ? [{ ...column, benchmark }] : [];
  });
  const occupied = occupiedKeys(columns);
  const lockedTier = lockSizes ? columns[0]?.tier : undefined;
  const canAdd = availableRotationFrom(catalog, boundType).some(
    (candidate) =>
      !occupied.has(configurationKey(candidate)) &&
      (!lockedTier || candidate.tier === lockedTier),
  );
  const matchTiers = TIER_OPTIONS.filter((tier) =>
    columns.every((column) =>
      Boolean(
        lookupBenchmark(
          catalog,
          column.provider,
          tier.id,
          boundType,
          column.variant,
        ),
      ),
    ),
  );
  const synced =
    resolved.length > 0 && resolved.every((column) => column.tier === resolved[0]?.tier);

  return {
    append,
    boundType,
    canAdd,
    changeBoundType,
    columns: resolved,
    lockSizes,
    lockedTier,
    matchSizes,
    matchTiers,
    occupied,
    occupiedExcept: (columnId: string) => occupiedKeys(columns, columnId),
    railRef,
    remove,
    reorder,
    setLockSizes,
    synced,
    update,
  };
}
