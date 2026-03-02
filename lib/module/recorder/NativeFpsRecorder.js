"use strict";

import { NativeEventEmitter } from 'react-native';
import NativeRnPerfScore from "../NativeRnPerfScore.js";
export class NativeFpsRecorder {
  subscription = null;
  constructor(onSample) {
    this.eventEmitter = new NativeEventEmitter(NativeRnPerfScore);
    this.onSample = onSample;
  }
  start(sampleIntervalMs) {
    this.subscription = this.eventEmitter.addListener('onUiFpsSample', data => {
      const sample = data;
      this.onSample(sample.timestamp, sample.fps);
    });
    NativeRnPerfScore.startRecording(sampleIntervalMs);
  }
  stop() {
    NativeRnPerfScore.stopRecording();
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}
//# sourceMappingURL=NativeFpsRecorder.js.map