import type { MetricSample } from '../models/health';

export function hourlySamples(samples: MetricSample[]): MetricSample[] {
  const groups = new Map<number, number[]>();
  for (const sample of samples) { const hour = Math.floor(new Date(sample.atUtc).getTime() / 3600000) * 3600000; groups.set(hour, [...(groups.get(hour) ?? []), sample.value]); }
  return [...groups].sort(([a], [b]) => a - b).map(([time, values]) => ({ atUtc: new Date(time).toISOString(), value: values.reduce((a, b) => a + b, 0) / values.length }));
}
