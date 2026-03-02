import { Platform } from 'react-native';
import type {
  FpsSample,
  PerfEvent,
  PerfReport,
  PerfScoreConfig,
  StepMarker,
  DeviceInfo,
  PerfEventType,
} from './types';
import { DEFAULT_CONFIG } from './types';
import { calculateScore } from './lib/scoring';
import { JsFpsRecorder } from './recorder/JsFpsRecorder';
import { NativeFpsRecorder } from './recorder/NativeFpsRecorder';
import { FpsDataStore } from './recorder/FpsDataStore';
import { AutoInstrumentation } from './instrumentation';
import { writeResultFile, getResultFilePath } from './utils/fileWriter';
import { now } from './utils/timestamp';

class PerfScoreRecorder {
  private config: Required<PerfScoreConfig> = { ...DEFAULT_CONFIG };
  private jsFpsRecorder: JsFpsRecorder | null = null;
  private nativeFpsRecorder: NativeFpsRecorder | null = null;
  private dataStore: FpsDataStore | null = null;
  private autoInstrumentation: AutoInstrumentation | null = null;
  private startTime: number = 0;
  private recording: boolean = false;

  configure(config: PerfScoreConfig): void {
    const filtered = Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined)
    );
    this.config = { ...DEFAULT_CONFIG, ...filtered };
  }

  start(config?: PerfScoreConfig): void {
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

    this.jsFpsRecorder = new JsFpsRecorder(
      this.config.sampleIntervalMs,
      this.config.targetFps,
      (timestamp, fps) => this.dataStore?.onJsFps(timestamp, fps)
    );

    this.nativeFpsRecorder = new NativeFpsRecorder((timestamp, fps) =>
      this.dataStore?.onUiFps(timestamp, fps)
    );

    this.nativeFpsRecorder.start(this.config.sampleIntervalMs);
    this.jsFpsRecorder.start();

    if (this.config.enableAutoInstrumentation) {
      this.autoInstrumentation = new AutoInstrumentation((event) =>
        this.dataStore?.addEvent(event)
      );
      this.autoInstrumentation.start();
    }
  }

  attachNavigation(navigationRef: {
    addListener: (
      event: string,
      callback: (e: {
        data?: { state?: { routes?: { name: string }[] } };
      }) => void
    ) => () => void;
  }): void {
    this.autoInstrumentation
      ?.getNavigationTracker()
      .attachToNavigation(navigationRef);
  }

  stop(): FpsSample[] {
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

  mark(label: string, metadata?: Record<string, unknown>): void {
    if (!this.recording || !this.dataStore) return;
    this.dataStore.addEvent({
      timestamp: now(),
      type: 'custom',
      label,
      metadata,
    });
  }

  addEvent(event: PerfEvent): void {
    if (!this.recording || !this.dataStore) return;
    this.dataStore.addEvent(event);
  }

  isRecording(): boolean {
    return this.recording;
  }

  stopAndSave(filename?: string): PerfReport {
    const samples = this.stop();
    const endTime = now();
    const fname = filename ?? this.config.outputFilename;

    const report = this.buildReport(samples, this.startTime, endTime);
    writeResultFile(fname, report);

    return report;
  }

  private buildReport(
    samples: FpsSample[],
    startTime: number,
    endTime: number
  ): PerfReport {
    // Trim warmup: skip leading samples before native recorder delivers first real value
    const firstValidIdx = samples.findIndex((s) => s.jsFps > 0 && s.uiFps > 0);
    const trimmedSamples =
      firstValidIdx > 0 ? samples.slice(firstValidIdx) : samples;

    const metrics = calculateScore(trimmedSamples, this.config.targetFps);

    return {
      version: 1,
      deviceInfo: {
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        model: 'unknown',
        osVersion: `${Platform.Version}`,
        appId: 'unknown',
      },
      startTime,
      endTime,
      sampleIntervalMs: this.config.sampleIntervalMs,
      targetFps: this.config.targetFps,
      samples: trimmedSamples,
      steps: [],
      ...metrics,
    };
  }
}

export const PerfScore = new PerfScoreRecorder();

export type {
  FpsSample,
  PerfEvent,
  PerfReport,
  PerfScoreConfig,
  StepMarker,
  DeviceInfo,
  PerfEventType,
};
export { DEFAULT_CONFIG, getResultFilePath };
export { calculateScore } from './lib/scoring';
export type { ScoreResult } from './lib/scoring';
export { PerfMonitor } from './PerfMonitor';
export type { PerfMonitorProps } from './PerfMonitor';
