import type { FpsSample, PerfEvent } from '../types';

export class FpsDataStore {
  private samples: FpsSample[] = [];
  private pendingEvents: PerfEvent[] = [];
  private latestJsFps: number = 0;
  private latestUiFps: number = 0;
  constructor(_sampleIntervalMs: number) {
    // interval stored for potential future use (e.g. gap detection)
  }

  onJsFps(timestamp: number, fps: number): void {
    this.latestJsFps = fps;
    this.flushSample(timestamp);
  }

  onUiFps(_timestamp: number, fps: number): void {
    this.latestUiFps = fps;
  }

  addEvent(event: PerfEvent): void {
    this.pendingEvents.push(event);
  }

  getSamples(): FpsSample[] {
    return [...this.samples];
  }

  clear(): void {
    this.samples = [];
    this.pendingEvents = [];
    this.latestJsFps = 0;
    this.latestUiFps = 0;
  }

  private flushSample(timestamp: number): void {
    const events = this.pendingEvents.splice(0, this.pendingEvents.length);
    this.samples.push({
      timestamp,
      jsFps: this.latestJsFps,
      uiFps: this.latestUiFps,
      events,
    });
  }
}
