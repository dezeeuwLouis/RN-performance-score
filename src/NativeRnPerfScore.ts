import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startRecording(sampleIntervalMs: number): void;
  stopRecording(): void;
  isRecording(): boolean;
  getUiFpsSamples(): string;
  writeResultFile(filename: string, jsonContent: string): string;
  getResultFilePath(filename: string): string;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RnPerfScore');
