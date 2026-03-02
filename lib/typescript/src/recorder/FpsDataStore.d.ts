import type { FpsSample, PerfEvent } from '../types';
export declare class FpsDataStore {
    private samples;
    private pendingEvents;
    private latestJsFps;
    private uiFpsBuffer;
    private sampleIntervalMs;
    constructor(sampleIntervalMs: number);
    onJsFps(timestamp: number, fps: number): void;
    onUiFps(timestamp: number, fps: number): void;
    addEvent(event: PerfEvent): void;
    getSamples(): FpsSample[];
    clear(): void;
    private flushSample;
    private findClosestUiFps;
}
//# sourceMappingURL=FpsDataStore.d.ts.map