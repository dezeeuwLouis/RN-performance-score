import { now } from '../utils/timestamp';

export type JsFpsSampleCallback = (timestamp: number, fps: number) => void;

export class JsFpsRecorder {
  private animationFrameId: number | null = null;
  private frameCount: number = 0;
  private intervalStart: number = 0;
  private sampleIntervalMs: number;
  private targetFps: number;
  private onSample: JsFpsSampleCallback;
  private running: boolean = false;

  constructor(
    sampleIntervalMs: number,
    targetFps: number,
    onSample: JsFpsSampleCallback
  ) {
    this.sampleIntervalMs = sampleIntervalMs;
    this.targetFps = targetFps;
    this.onSample = onSample;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.intervalStart = now();
    this.frameCount = 0;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private tick = (): void => {
    if (!this.running) return;

    const currentTime = now();
    this.frameCount++;

    const elapsed = currentTime - this.intervalStart;
    if (elapsed >= this.sampleIntervalMs) {
      const fps = Math.min(
        Math.round((this.frameCount / elapsed) * 1000),
        this.targetFps
      );
      this.onSample(currentTime, fps);
      this.frameCount = 0;
      this.intervalStart = currentTime;
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
