import type { PerfEvent } from '../types';
type EventCallback = (event: PerfEvent) => void;
export declare class NetworkInterceptor {
    private originalFetch;
    private onEvent;
    private active;
    constructor(onEvent: EventCallback);
    start(): void;
    stop(): void;
    private interceptFetch;
    private restoreFetch;
}
export {};
//# sourceMappingURL=NetworkInterceptor.d.ts.map