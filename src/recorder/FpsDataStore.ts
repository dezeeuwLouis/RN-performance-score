import type { FpsSample, PerfEvent } from '../types';

interface TimestampedUiFps {
  timestamp: number;
  fps: number;
}

const UI_BUFFER_MAX = 10;

export class FpsDataStore {
  private samples: FpsSample[] = [];
  private pendingEvents: PerfEvent[] = [];
  private latestJsFps: number = 0;
  private uiFpsBuffer: TimestampedUiFps[] = [];
  private sampleIntervalMs: number;

  constructor(sampleIntervalMs: number) {
    this.sampleIntervalMs = sampleIntervalMs;
  }

  onJsFps(timestamp: number, fps: number): void {
    this.latestJsFps = fps;
    this.flushSample(timestamp);
  }

  onUiFps(timestamp: number, fps: number): void {
    this.uiFpsBuffer.push({ timestamp, fps });
    if (this.uiFpsBuffer.length > UI_BUFFER_MAX) {
      this.uiFpsBuffer.shift();
    }
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
    this.uiFpsBuffer = [];
  }

  private flushSample(timestamp: number): void {
    const uiFps = this.findClosestUiFps(timestamp);
    const events = this.pendingEvents.splice(0, this.pendingEvents.length);
    this.samples.push({
      timestamp,
      jsFps: this.latestJsFps,
      uiFps,
      events,
    });
  }

  private findClosestUiFps(timestamp: number): number {
    if (this.uiFpsBuffer.length === 0) return 0;

    let bestIdx = 0;
    let bestDist = Math.abs(this.uiFpsBuffer[0]!.timestamp - timestamp);

    for (let i = 1; i < this.uiFpsBuffer.length; i++) {
      const dist = Math.abs(this.uiFpsBuffer[i]!.timestamp - timestamp);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    // Only use if within a reasonable window
    if (bestDist <= this.sampleIntervalMs * 2) {
      return this.uiFpsBuffer[bestIdx]!.fps;
    }

    // Fall back to latest
    return this.uiFpsBuffer[this.uiFpsBuffer.length - 1]!.fps;
  }
}
