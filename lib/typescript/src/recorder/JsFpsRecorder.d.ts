export type JsFpsSampleCallback = (timestamp: number, fps: number) => void;
export declare class JsFpsRecorder {
    private animationFrameId;
    private frameTimestamps;
    private framesSinceEmit;
    private lastEmitTime;
    private sampleIntervalMs;
    private windowMs;
    private targetFps;
    private onSample;
    private running;
    constructor(sampleIntervalMs: number, targetFps: number, onSample: JsFpsSampleCallback);
    start(): void;
    stop(): void;
    isRunning(): boolean;
    private tick;
}
//# sourceMappingURL=JsFpsRecorder.d.ts.map