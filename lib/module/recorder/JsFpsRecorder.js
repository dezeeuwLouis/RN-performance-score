"use strict";

import { now } from "../utils/timestamp.js";
/** Sliding window: 3× sample interval smooths jitter during normal operation */
const WINDOW_MULTIPLIER = 3;
const SNAP_THRESHOLD = 0.92;
export class JsFpsRecorder {
  animationFrameId = null;
  frameTimestamps = [];
  framesSinceEmit = 0;
  lastEmitTime = 0;
  running = false;
  constructor(sampleIntervalMs, targetFps, onSample) {
    this.sampleIntervalMs = sampleIntervalMs;
    this.windowMs = sampleIntervalMs * WINDOW_MULTIPLIER;
    this.targetFps = targetFps;
    this.onSample = onSample;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.lastEmitTime = now();
    this.frameTimestamps = [];
    this.framesSinceEmit = 0;
    this.tick();
  }
  stop() {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  isRunning() {
    return this.running;
  }
  tick = () => {
    if (!this.running) return;
    const currentTime = now();
    this.frameTimestamps.push(currentTime);
    this.framesSinceEmit++;

    // Trim timestamps older than the sliding window
    const cutoff = currentTime - this.windowMs;
    while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < cutoff) {
      this.frameTimestamps.shift();
    }
    const elapsed = currentTime - this.lastEmitTime;
    if (elapsed >= this.sampleIntervalMs) {
      let fps;
      if (elapsed > this.windowMs) {
        // JS thread was blocked — use frame count over actual elapsed time
        fps = this.framesSinceEmit / elapsed * 1000;
      } else if (this.frameTimestamps.length >= 2) {
        // Normal operation — use sliding window for smooth readings
        const oldest = this.frameTimestamps[0];
        const span = currentTime - oldest;
        fps = span > 0 ? (this.frameTimestamps.length - 1) / span * 1000 : 0;
      } else {
        fps = 0;
      }
      const snapped = fps >= this.targetFps * SNAP_THRESHOLD ? this.targetFps : Math.min(fps, this.targetFps);
      this.onSample(currentTime, snapped);
      this.lastEmitTime = currentTime;
      this.framesSinceEmit = 0;
    }
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
//# sourceMappingURL=JsFpsRecorder.js.map