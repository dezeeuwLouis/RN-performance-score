import type { PerfEvent } from '../types';
type EventCallback = (event: PerfEvent) => void;
export declare class NavigationTracker {
    private onEvent;
    private unsubscribe;
    constructor(onEvent: EventCallback);
    start(): void;
    stop(): void;
    attachToNavigation(navigationRef: {
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
    private tryAttachReactNavigation;
}
export {};
//# sourceMappingURL=NavigationTracker.d.ts.map