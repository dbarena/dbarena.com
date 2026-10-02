import { readFile } from "node:fs/promises";
import path from "node:path";

export type NewOrderSample = {
  tSeconds: number;
  tpm: number;
};

const MAX_POINTS = 180;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

export function minVsMedian(values: number[]) {
  if (values.length === 0) return null;
  const typical = median(values);
  if (typical <= 0) return null;
  return Math.min(...values) / typical;
}

function downsample(samples: NewOrderSample[], maxPoints: number) {
  if (samples.length <= maxPoints) return samples;
  const step = samples.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, index) => {
    const sampleIndex = Math.min(
      samples.length - 1,
      Math.round(index * step),
    );
    return samples[sampleIndex]!;
  });
}

function resolveRawMetricsPath(
  resultsDirectory: string,
  resultPath: string,
  rawMetricsFile: string | null,
) {
  if (!rawMetricsFile || path.isAbsolute(rawMetricsFile)) return null;
  const csvPath = path.join(
    resultsDirectory,
    path.dirname(resultPath),
    rawMetricsFile,
  );
  const resultsRoot = path.resolve(resultsDirectory);
  const resolved = path.resolve(csvPath);
  if (
    resolved !== resultsRoot &&
    !resolved.startsWith(`${resultsRoot}${path.sep}`)
  ) {
    return null;
  }
  return resolved;
}

export async function readNewOrderSeries(
  resultsDirectory: string,
  resultPath: string,
  rawMetricsFile: string | null,
): Promise<{ samples: NewOrderSample[] | null; minVsMedian: number | null; sampleCount: number | null }> {
  const csvPath = resolveRawMetricsPath(
    resultsDirectory,
    resultPath,
    rawMetricsFile,
  );
  if (!csvPath) return { samples: null, minVsMedian: null, sampleCount: null };

  let text: string;
  try {
    text = await readFile(csvPath, "utf8");
  } catch {
    return { samples: null, minVsMedian: null, sampleCount: null };
  }

  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { samples: null, minVsMedian: null, sampleCount: null };

  const header = lines[0]!.split(",");
  const tIndex = header.indexOf("t_seconds");
  const tpmIndex = header.indexOf("new_order_tpm");
  if (tIndex < 0 || tpmIndex < 0) return { samples: null, minVsMedian: null, sampleCount: null };

  const buckets = new Map<number, number[]>();
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const tSeconds = Number(cells[tIndex]);
    const tpm = Number(cells[tpmIndex]);
    if (!Number.isFinite(tSeconds) || !Number.isFinite(tpm)) continue;
    const bucket = buckets.get(tSeconds) ?? [];
    bucket.push(tpm);
    buckets.set(tSeconds, bucket);
  }

  const samples = [...buckets.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([tSeconds, values]) => ({ tSeconds, tpm: median(values) }));

  if (samples.length === 0) return { samples: null, minVsMedian: null, sampleCount: null };
  return {
    samples: downsample(samples, MAX_POINTS),
    minVsMedian: minVsMedian(samples.map((sample) => sample.tpm)),
    // The raw per-second row count, before downsampling for the chart.
    sampleCount: samples.length,
  };
}
