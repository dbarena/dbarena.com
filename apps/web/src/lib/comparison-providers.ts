import type { BenchmarkSummary } from "@/lib/benchmarks";
import {
  providerName,
  providerDescription,
  sortProviders,
  type ColumnProvider,
} from "@/lib/catalog";

export type ComparisonProvider = {
  id: string;
  name: string;
  products: ColumnProvider[];
};

const HOST_NAMES: Record<string, string> = {
  aws: "AWS",
  gcp: "GCP",
  supabase: "Supabase",
};

const PRODUCT_NAMES: Record<string, string> = {
  supabase: "Managed Postgres",
  orioledb: "OrioleDB",
  rds: "RDS",
  "cloud-sql-for-postgres": "Cloud SQL for PostgreSQL",
};

const PRODUCT_SUMMARIES: Record<string, string> = {
  supabase: "Supabase Postgres on the default storage engine",
  orioledb: "Supabase Postgres on the OrioleDB storage engine",
  rds: "Amazon RDS",
  "cloud-sql-for-postgres": "Google Cloud SQL for PostgreSQL",
};

export function productSummary(product: ColumnProvider) {
  return PRODUCT_SUMMARIES[product] ?? providerDescription(product);
}

export function hostName(host: string) {
  return HOST_NAMES[host] ?? providerName(host);
}

export function productName(product: ColumnProvider) {
  return PRODUCT_NAMES[product] ?? providerName(product);
}

export function comparisonName(benchmark: Pick<BenchmarkSummary, "host" | "provider">) {
  return `${hostName(benchmark.host)} · ${productName(benchmark.provider)}`;
}

// BenchmarkSummary.provider is the historical product ID. Keep those IDs in
// catalog keys and shared URLs; group the UI using the actual host field.
export function comparisonProviders(benchmarks: Iterable<BenchmarkSummary>): ComparisonProvider[] {
  const byHost = new Map<string, Set<ColumnProvider>>();
  for (const benchmark of benchmarks) {
    const products = byHost.get(benchmark.host) ?? new Set<ColumnProvider>();
    products.add(benchmark.provider);
    byHost.set(benchmark.host, products);
  }
  return sortProviders(byHost.keys()).map((host) => ({
    id: host,
    name: hostName(host),
    products: sortProviders(byHost.get(host)!),
  }));
}
