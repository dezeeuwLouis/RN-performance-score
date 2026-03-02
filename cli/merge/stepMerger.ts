import * as fs from 'fs';
import type { StepMarker, PerfReport } from '../types';

export function parseStepsFile(filePath: string): StepMarker[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`[rn-perf-score] Steps file not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  return lines.map((line) => {
    const spaceIndex = line.indexOf(' ');
    if (spaceIndex === -1) {
      return { timestamp: parseInt(line, 10), label: 'unknown' };
    }
    return {
      timestamp: parseInt(line.substring(0, spaceIndex), 10),
      label: line.substring(spaceIndex + 1).trim(),
    };
  });
}

export function mergeStepsIntoReport(
  report: PerfReport,
  steps: StepMarker[]
): PerfReport {
  return {
    ...report,
    steps: [...report.steps, ...steps].sort(
      (a, b) => a.timestamp - b.timestamp
    ),
  };
}
