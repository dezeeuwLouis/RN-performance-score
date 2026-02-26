export interface FpsSample {
  timestamp: number;
  jsFps: number;
  uiFps: number;
  events: PerfEvent[];
}

export interface PerfEvent {
  timestamp: number;
  type: string;
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

export const MAX_SCORE = 100;
export const SCORE_GOOD_THRESHOLD = 80;
export const SCORE_WARNING_THRESHOLD = 50;
export const DROPPED_FRAME_RATIO = 0.9;
export const MS_PER_SECOND = 1000;

export const UI_WEIGHT = 0.6;
export const JS_WEIGHT = 0.4;
export const AVG_SEVERITY_WEIGHT = 50;
export const WORST_SEVERITY_WEIGHT = 60;

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
