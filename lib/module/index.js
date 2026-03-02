"use strict";

import { Platform } from 'react-native';
import { DEFAULT_CONFIG } from "./types.js";
import { calculateScore } from "./lib/scoring.js";
import { JsFpsRecorder } from "./recorder/JsFpsRecorder.js";
import { NativeFpsRecorder } from "./recorder/NativeFpsRecorder.js";
import { FpsDataStore } from "./recorder/FpsDataStore.js";
import { AutoInstrumentation } from "./instrumentation/index.js";
import { writeResultFile, getResultFilePath } from "./utils/fileWriter.js";
import { now } from "./utils/timestamp.js";
class PerfScoreRecorder {
  config = {
    ...DEFAULT_CONFIG
  };
  jsFpsRecorder = null;
  nativeFpsRecorder = null;
  dataStore = null;
  autoInstrumentation = null;
  startTime = 0;
  recording = false;
  configure(config) {
    const filtered = Object.fromEntries(Object.entries(config).filter(([, v]) => v !== undefined));
    this.config = {
      ...DEFAULT_CONFIG,
      ...filtered
    };
  }
  start(config) {
    if (this.recording) {
      console.warn('[rn-perf-score] Already recording. Call stop() first.');
      return;
    }
    if (config) {
      this.configure(config);
    }
    this.recording = true;
    this.startTime = now();
    this.dataStore = new FpsDataStore(this.config.sampleIntervalMs);
    this.jsFpsRecorder = new JsFpsRecorder(this.config.sampleIntervalMs, this.config.targetFps, (timestamp, fps) => this.dataStore?.onJsFps(timestamp, fps));
    this.nativeFpsRecorder = new NativeFpsRecorder((timestamp, fps) => this.dataStore?.onUiFps(timestamp, fps));
    this.nativeFpsRecorder.start(this.config.sampleIntervalMs);
    this.jsFpsRecorder.start();
    if (this.config.enableAutoInstrumentation) {
      this.autoInstrumentation = new AutoInstrumentation(event => this.dataStore?.addEvent(event));
      this.autoInstrumentation.start();
    }
  }
  attachNavigation(navigationRef) {
    this.autoInstrumentation?.getNavigationTracker().attachToNavigation(navigationRef);
  }
  stop() {
    if (!this.recording) {
      console.warn('[rn-perf-score] Not recording.');
      return [];
    }
    this.recording = false;
    this.jsFpsRecorder?.stop();
    this.nativeFpsRecorder?.stop();
    this.autoInstrumentation?.stop();
    this.autoInstrumentation = null;
    const samples = this.dataStore?.getSamples() ?? [];
    return samples;
  }
  mark(label, metadata) {
    if (!this.recording || !this.dataStore) return;
    this.dataStore.addEvent({
      timestamp: now(),
      type: 'custom',
      label,
      metadata
    });
  }
  addEvent(event) {
    if (!this.recording || !this.dataStore) return;
    this.dataStore.addEvent(event);
  }
  isRecording() {
    return this.recording;
  }
  stopAndSave(filename) {
    const samples = this.stop();
    const endTime = now();
    const fname = filename ?? this.config.outputFilename;
    const report = this.buildReport(samples, this.startTime, endTime);
    writeResultFile(fname, report);
    return report;
  }
  buildReport(samples, startTime, endTime) {
    // Trim warmup: skip leading samples before native recorder delivers first real value
    const firstValidIdx = samples.findIndex(s => s.jsFps > 0 && s.uiFps > 0);
    const trimmedSamples = firstValidIdx > 0 ? samples.slice(firstValidIdx) : samples;
    const metrics = calculateScore(trimmedSamples, this.config.targetFps);
    return {
      version: 1,
      deviceInfo: {
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        model: 'unknown',
        osVersion: `${Platform.Version}`,
        appId: 'unknown'
      },
      startTime,
      endTime,
      sampleIntervalMs: this.config.sampleIntervalMs,
      targetFps: this.config.targetFps,
      samples: trimmedSamples,
      steps: [],
      ...metrics
    };
  }
}
export const PerfScore = new PerfScoreRecorder();
export { DEFAULT_CONFIG, getResultFilePath };
export { calculateScore } from "./lib/scoring.js";
export { PerfMonitor } from "./PerfMonitor.js";
//# sourceMappingURL=index.js.map