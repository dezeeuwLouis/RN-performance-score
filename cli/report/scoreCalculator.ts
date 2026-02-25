import type { PerfReport, FpsSample } from '../types';
import {
  MAX_SCORE,
  SCORE_GOOD_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
  DROPPED_FRAME_RATIO,
  MS_PER_SECOND,
  UI_WEIGHT,
  JS_WEIGHT,
  MAX_DROP_PENALTY,
} from '../types';

export function calculateScore(
  samples: FpsSample[],
  targetFps: number
): { score: number; avgJsFps: number; avgUiFps: number; minJsFps: number; minUiFps: number; droppedFramesJs: number; droppedFramesUi: number } {
  if (samples.length === 0) {
    return { score: 0, avgJsFps: 0, avgUiFps: 0, minJsFps: 0, minUiFps: 0, droppedFramesJs: 0, droppedFramesUi: 0 };
  }

  const jsFpsValues = samples.map((s) => s.jsFps);
  const uiFpsValues = samples.map((s) => s.uiFps);

  const avgJsFps = jsFpsValues.reduce((a, b) => a + b, 0) / jsFpsValues.length;
  const avgUiFps = uiFpsValues.reduce((a, b) => a + b, 0) / uiFpsValues.length;

  const jsFpsScore = Math.min((avgJsFps / targetFps) * MAX_SCORE, MAX_SCORE);
  const uiFpsScore = Math.min((avgUiFps / targetFps) * MAX_SCORE, MAX_SCORE);
  const baseScore = uiFpsScore * UI_WEIGHT + jsFpsScore * JS_WEIGHT;

  const threshold = targetFps * DROPPED_FRAME_RATIO;
  const droppedFramesJs = jsFpsValues.filter((f) => f < threshold).length;
  const droppedFramesUi = uiFpsValues.filter((f) => f < threshold).length;

  const dropRatio = (droppedFramesJs + droppedFramesUi) / (samples.length * 2);
  const penalty = dropRatio * MAX_DROP_PENALTY;
  const score = Math.max(0, Math.round(baseScore - penalty));

  return {
    score,
    avgJsFps: Math.round(avgJsFps * 10) / 10,
    avgUiFps: Math.round(avgUiFps * 10) / 10,
    minJsFps: Math.min(...jsFpsValues),
    minUiFps: Math.min(...uiFpsValues),
    droppedFramesJs,
    droppedFramesUi,
  };
}

export function printScoreSummary(report: PerfReport): void {
  const duration = ((report.endTime - report.startTime) / MS_PER_SECOND).toFixed(1);

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  rn-perf-score Results');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log(`  Score:          ${formatScore(report.score)}`);
  console.log(`  Duration:       ${duration}s`);
  console.log(`  Samples:        ${report.samples.length}`);
  console.log('');
  console.log('  JS Thread FPS');
  console.log(`    Average:      ${report.avgJsFps}`);
  console.log(`    Minimum:      ${report.minJsFps}`);
  console.log(`    Dropped:      ${report.droppedFramesJs} samples`);
  console.log('');
  console.log('  UI Thread FPS');
  console.log(`    Average:      ${report.avgUiFps}`);
  console.log(`    Minimum:      ${report.minUiFps}`);
  console.log(`    Dropped:      ${report.droppedFramesUi} samples`);
  console.log('');
  console.log('═══════════════════════════════════════');
}

function formatScore(score: number): string {
  if (score >= SCORE_GOOD_THRESHOLD) return `${score}/${MAX_SCORE} ✓ GOOD`;
  if (score >= SCORE_WARNING_THRESHOLD) return `${score}/${MAX_SCORE} ~ WARNING`;
  return `${score}/${MAX_SCORE} ✗ POOR`;
}
