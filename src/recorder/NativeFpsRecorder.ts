import { NativeEventEmitter } from 'react-native';
import NativeRnPerfScore from '../NativeRnPerfScore';

export interface UiFpsSample {
  timestamp: number;
  fps: number;
}

export type UiFpsSampleCallback = (timestamp: number, fps: number) => void;

export class NativeFpsRecorder {
  private eventEmitter: NativeEventEmitter;
  private subscription: ReturnType<NativeEventEmitter['addListener']> | null =
    null;
  private onSample: UiFpsSampleCallback;

  constructor(onSample: UiFpsSampleCallback) {
    this.eventEmitter = new NativeEventEmitter(NativeRnPerfScore);
    this.onSample = onSample;
  }

  start(sampleIntervalMs: number): void {
    this.subscription = this.eventEmitter.addListener(
      'onUiFpsSample',
      (data: unknown) => {
        const sample = data as UiFpsSample;
        this.onSample(sample.timestamp, sample.fps);
      }
    );
    NativeRnPerfScore.startRecording(sampleIntervalMs);
  }

  stop(): void {
    NativeRnPerfScore.stopRecording();
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}
