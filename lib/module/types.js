"use strict";

export const DEFAULT_SAMPLE_INTERVAL_MS = 100;
export const DEFAULT_TARGET_FPS = 60;
export const DEFAULT_OUTPUT_FILENAME = 'rn-perf-score-results.json';
export const MAX_SCORE = 100;
export const SCORE_GOOD_THRESHOLD = 80;
export const SCORE_WARNING_THRESHOLD = 50;
export const DROPPED_FRAME_RATIO = 0.9;
export const MS_PER_SECOND = 1000;
export const UI_WEIGHT = 0.6;
export const JS_WEIGHT = 0.4;
export const AVG_SEVERITY_WEIGHT = 50;
export const WORST_SEVERITY_WEIGHT = 60;
export const DEFAULT_CONFIG = {
  sampleIntervalMs: DEFAULT_SAMPLE_INTERVAL_MS,
  targetFps: DEFAULT_TARGET_FPS,
  enableAutoInstrumentation: true,
  outputFilename: DEFAULT_OUTPUT_FILENAME
};
//# sourceMappingURL=types.js.map