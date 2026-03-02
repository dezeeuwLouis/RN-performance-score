import type { TurboModule } from 'react-native';
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
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeRnPerfScore.d.ts.map