import type { PerfScoreConfig } from './types';
import { PerfScore } from './index';
export interface PerfMonitorProps extends PerfScoreConfig {
    onComplete?: (report: ReturnType<typeof PerfScore.stopAndSave>) => void;
}
export declare function PerfMonitor({ sampleIntervalMs, targetFps, enableAutoInstrumentation, outputFilename, onComplete, }: PerfMonitorProps): null;
//# sourceMappingURL=PerfMonitor.d.ts.map