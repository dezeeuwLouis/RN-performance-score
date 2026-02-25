export interface FpsSample {
  timestamp: number;
  jsFps: number;
  uiFps: number;
  events: PerfEvent[];
}

export type PerfEventType =
  | 'navigation'
  | 'network_start'
  | 'network_end'
  | 'long_task'
  | 'custom';

export interface PerfEvent {
  timestamp: number;
  type: PerfEventType;
  label: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface StepMarker {
  timestamp: number;
  label: string;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  model: string;
  osVersion: string;
  appId: string;
}

export interface PerfReport {
  version: number;
  deviceInfo: DeviceInfo;
  startTime: number;
  endTime: number;
  sampleIntervalMs: number;
  targetFps: number;
  samples: FpsSample[];
  steps: StepMarker[];
  score: number;
  avgJsFps: number;
  avgUiFps: number;
  minJsFps: number;
  minUiFps: number;
  droppedFramesJs: number;
  droppedFramesUi: number;
}

export interface PerfScoreConfig {
  sampleIntervalMs?: number;
  targetFps?: number;
  enableAutoInstrumentation?: boolean;
  outputFilename?: string;
}

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
export const MAX_DROP_PENALTY = 30;

export const DEFAULT_CONFIG: Required<PerfScoreConfig> = {
  sampleIntervalMs: DEFAULT_SAMPLE_INTERVAL_MS,
  targetFps: DEFAULT_TARGET_FPS,
  enableAutoInstrumentation: true,
  outputFilename: DEFAULT_OUTPUT_FILENAME,
};
