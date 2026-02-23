import type { PerfEvent } from '../types';
import { now } from '../utils/timestamp';

type EventCallback = (event: PerfEvent) => void;

const LONG_TASK_THRESHOLD_MS = 16;

export class JsTaskMonitor {
  private onEvent: EventCallback;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private running: boolean = false;

  constructor(onEvent: EventCallback) {
    this.onEvent = onEvent;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = now();
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick = (): void => {
    if (!this.running) return;

    const currentTime = now();
    const gap = currentTime - this.lastFrameTime;

    if (gap > LONG_TASK_THRESHOLD_MS) {
      this.onEvent({
        timestamp: currentTime,
        type: 'long_task',
        label: `JS blocked ${Math.round(gap)}ms`,
        duration: gap,
      });
    }

    this.lastFrameTime = currentTime;
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
