import { now } from '../utils/timestamp';

export type JsFpsSampleCallback = (timestamp: number, fps: number) => void;

const MAX_BUFFER_SIZE = 64;

export class JsFpsRecorder {
  private animationFrameId: number | null = null;
  private frameTimestamps: number[] = [];
  private lastEmitTime: number = 0;
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
    this.lastEmitTime = now();
    this.frameTimestamps = [];
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

    // Push into rolling buffer
    this.frameTimestamps.push(currentTime);
    if (this.frameTimestamps.length > MAX_BUFFER_SIZE) {
      this.frameTimestamps.shift();
    }

    const elapsed = currentTime - this.lastEmitTime;
    if (elapsed >= this.sampleIntervalMs && this.frameTimestamps.length >= 2) {
      const oldest = this.frameTimestamps[0]!;
      const newest = this.frameTimestamps[this.frameTimestamps.length - 1]!;
      const span = newest - oldest;

      let fps = 0;
      if (span > 0) {
        fps = Math.min(
          ((this.frameTimestamps.length - 1) / span) * 1000,
          this.targetFps
        );
      }

      this.onSample(currentTime, fps);
      this.lastEmitTime = currentTime;
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
