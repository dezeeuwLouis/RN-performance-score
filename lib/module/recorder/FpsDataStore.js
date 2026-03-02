"use strict";

const UI_BUFFER_MAX = 10;
export class FpsDataStore {
  samples = [];
  pendingEvents = [];
  latestJsFps = 0;
  uiFpsBuffer = [];
  constructor(sampleIntervalMs) {
    this.sampleIntervalMs = sampleIntervalMs;
  }
  onJsFps(timestamp, fps) {
    this.latestJsFps = fps;
    this.flushSample(timestamp);
  }
  onUiFps(timestamp, fps) {
    this.uiFpsBuffer.push({
      timestamp,
      fps
    });
    if (this.uiFpsBuffer.length > UI_BUFFER_MAX) {
      this.uiFpsBuffer.shift();
    }
  }
  addEvent(event) {
    this.pendingEvents.push(event);
  }
  getSamples() {
    return [...this.samples];
  }
  clear() {
    this.samples = [];
    this.pendingEvents = [];
    this.latestJsFps = 0;
    this.uiFpsBuffer = [];
  }
  flushSample(timestamp) {
    const uiFps = this.findClosestUiFps(timestamp);
    const events = this.pendingEvents.splice(0, this.pendingEvents.length);
    this.samples.push({
      timestamp,
      jsFps: this.latestJsFps,
      uiFps,
      events
    });
  }
  findClosestUiFps(timestamp) {
    if (this.uiFpsBuffer.length === 0) return 0;
    let bestIdx = 0;
    let bestDist = Math.abs(this.uiFpsBuffer[0].timestamp - timestamp);
    for (let i = 1; i < this.uiFpsBuffer.length; i++) {
      const dist = Math.abs(this.uiFpsBuffer[i].timestamp - timestamp);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    // Only use if within a reasonable window
    if (bestDist <= this.sampleIntervalMs * 2) {
      return this.uiFpsBuffer[bestIdx].fps;
    }

    // Fall back to latest
    return this.uiFpsBuffer[this.uiFpsBuffer.length - 1].fps;
  }
}
//# sourceMappingURL=FpsDataStore.js.map