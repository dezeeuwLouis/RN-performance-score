import {
  MAX_SCORE,
  DROPPED_FRAME_RATIO,
  UI_WEIGHT,
  JS_WEIGHT,
  AVG_SEVERITY_WEIGHT,
  WORST_SEVERITY_WEIGHT,
} from '../types';

export interface ScoreResult {
  score: number;
  avgJsFps: number;
  avgUiFps: number;
  minJsFps: number;
  minUiFps: number;
  droppedFramesJs: number;
  droppedFramesUi: number;
}

/**
 * Calculate a performance score from FPS samples.
 *
 * The formula weights UI thread 60% and JS thread 40%, then applies
 * severity penalties based on frame drops.
 */
export function calculateScore(
  samples: ReadonlyArray<{ jsFps: number; uiFps: number }>,
  targetFps: number
): ScoreResult {
  if (samples.length === 0) {
    return {
      score: 0,
      avgJsFps: 0,
      avgUiFps: 0,
      minJsFps: 0,
      minUiFps: 0,
      droppedFramesJs: 0,
      droppedFramesUi: 0,
    };
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

  const severities = samples.map((s) => {
    const jsDeficit = Math.max(
      0,
      Math.min((targetFps - s.jsFps) / targetFps, 1)
    );
    const uiDeficit = Math.max(
      0,
      Math.min((targetFps - s.uiFps) / targetFps, 1)
    );
    return Math.max(jsDeficit, uiDeficit) ** 2;
  });

  const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
  const worstSeverity = Math.max(...severities);
  const penalty =
    avgSeverity * AVG_SEVERITY_WEIGHT + worstSeverity * WORST_SEVERITY_WEIGHT;
  const score = Math.max(0, Math.round(baseScore - penalty));

  return {
    score,
    avgJsFps: Math.round(avgJsFps * 10) / 10,
    avgUiFps: Math.round(avgUiFps * 10) / 10,
    minJsFps: Math.round(Math.min(...jsFpsValues) * 10) / 10,
    minUiFps: Math.round(Math.min(...uiFpsValues) * 10) / 10,
    droppedFramesJs,
    droppedFramesUi,
  };
}
