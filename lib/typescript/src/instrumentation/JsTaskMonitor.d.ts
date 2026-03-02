import type { PerfEvent } from '../types';
type EventCallback = (event: PerfEvent) => void;
export declare class JsTaskMonitor {
    private onEvent;
    private animationFrameId;
    private lastFrameTime;
    private running;
    constructor(onEvent: EventCallback);
    start(): void;
    stop(): void;
    private tick;
}
export {};
//# sourceMappingURL=JsTaskMonitor.d.ts.map