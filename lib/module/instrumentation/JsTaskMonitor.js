"use strict";

import { now } from "../utils/timestamp.js";
const LONG_TASK_THRESHOLD_MS = 100;
export class JsTaskMonitor {
  animationFrameId = null;
  lastFrameTime = 0;
  running = false;
  constructor(onEvent) {
    this.onEvent = onEvent;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = now();
    this.tick();
  }
  stop() {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  tick = () => {
    if (!this.running) return;
    const currentTime = now();
    const gap = currentTime - this.lastFrameTime;
    if (gap > LONG_TASK_THRESHOLD_MS) {
      this.onEvent({
        timestamp: currentTime,
        type: 'long_task',
        label: `JS blocked ${Math.round(gap)}ms`,
        duration: gap
      });
    }
    this.lastFrameTime = currentTime;
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
//# sourceMappingURL=JsTaskMonitor.js.map