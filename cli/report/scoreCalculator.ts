import type { PerfReport } from '../types';
import {
  MAX_SCORE,
  SCORE_GOOD_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
  MS_PER_SECOND,
} from '../types';

// Re-export from shared scoring module
export { calculateScore } from '../../src/lib/scoring';
export type { ScoreResult } from '../../src/lib/scoring';

export function printScoreSummary(report: PerfReport): void {
  const duration = (
    (report.endTime - report.startTime) /
    MS_PER_SECOND
  ).toFixed(1);

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
  if (score >= SCORE_WARNING_THRESHOLD)
    return `${score}/${MAX_SCORE} ~ WARNING`;
  return `${score}/${MAX_SCORE} ✗ POOR`;
}
