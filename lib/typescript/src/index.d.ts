import type { FpsSample, PerfEvent, PerfReport, PerfScoreConfig, StepMarker, DeviceInfo, PerfEventType } from './types';
import { DEFAULT_CONFIG } from './types';
import { getResultFilePath } from './utils/fileWriter';
declare class PerfScoreRecorder {
    private config;
    private jsFpsRecorder;
    private nativeFpsRecorder;
    private dataStore;
    private autoInstrumentation;
    private startTime;
    private recording;
    configure(config: PerfScoreConfig): void;
    start(config?: PerfScoreConfig): void;
    attachNavigation(navigationRef: {
        addListener: (event: string, callback: (e: {
            data?: {
                state?: {
                    routes?: {
                        name: string;
                    }[];
                };
            };
        }) => void) => () => void;
    }): void;
    stop(): FpsSample[];
    mark(label: string, metadata?: Record<string, unknown>): void;
    addEvent(event: PerfEvent): void;
    isRecording(): boolean;
    stopAndSave(filename?: string): PerfReport;
    private buildReport;
}
export declare const PerfScore: PerfScoreRecorder;
export type { FpsSample, PerfEvent, PerfReport, PerfScoreConfig, StepMarker, DeviceInfo, PerfEventType, };
export { DEFAULT_CONFIG, getResultFilePath };
export { calculateScore } from './lib/scoring';
export type { ScoreResult } from './lib/scoring';
export { PerfMonitor } from './PerfMonitor';
export type { PerfMonitorProps } from './PerfMonitor';
//# sourceMappingURL=index.d.ts.map