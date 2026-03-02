export interface UiFpsSample {
    timestamp: number;
    fps: number;
}
export type UiFpsSampleCallback = (timestamp: number, fps: number) => void;
export declare class NativeFpsRecorder {
    private eventEmitter;
    private subscription;
    private onSample;
    constructor(onSample: UiFpsSampleCallback);
    start(sampleIntervalMs: number): void;
    stop(): void;
}
//# sourceMappingURL=NativeFpsRecorder.d.ts.map