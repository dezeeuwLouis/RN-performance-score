import type { PerfReport, StepMarker } from '../types';
import { MS_PER_SECOND } from '../types';

export function generateChartData(report: PerfReport): {
  timestamps: number[];
  jsFps: number[];
  uiFps: number[];
  events: { timestamp: number; label: string; type: string }[];
  steps: StepMarker[];
} {
  const startTime = report.startTime;
  const timestamps = report.samples.map((s) => (s.timestamp - startTime) / MS_PER_SECOND);
  const jsFps = report.samples.map((s) => s.jsFps);
  const uiFps = report.samples.map((s) => s.uiFps);

  const events: { timestamp: number; label: string; type: string }[] = [];
  for (const sample of report.samples) {
    for (const event of sample.events) {
      events.push({
        timestamp: (event.timestamp - startTime) / MS_PER_SECOND,
        label: event.label,
        type: event.type,
      });
    }
  }

  const steps = report.steps.map((s) => ({
    timestamp: (s.timestamp - startTime) / MS_PER_SECOND,
    label: s.label,
  }));

  return { timestamps, jsFps, uiFps, events, steps };
}
