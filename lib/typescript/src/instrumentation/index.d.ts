import type { PerfEvent } from '../types';
import { NetworkInterceptor } from './NetworkInterceptor';
import { NavigationTracker } from './NavigationTracker';
import { JsTaskMonitor } from './JsTaskMonitor';
type EventCallback = (event: PerfEvent) => void;
export declare class AutoInstrumentation {
    private networkInterceptor;
    private navigationTracker;
    private jsTaskMonitor;
    constructor(onEvent: EventCallback);
    start(): void;
    stop(): void;
    getNavigationTracker(): NavigationTracker;
}
export { NetworkInterceptor, NavigationTracker, JsTaskMonitor };
//# sourceMappingURL=index.d.ts.map