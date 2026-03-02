import type { PerfEvent } from '../types';
import { now } from '../utils/timestamp';

type EventCallback = (event: PerfEvent) => void;

export class NavigationTracker {
  private onEvent: EventCallback;
  private unsubscribe: (() => void) | null = null;

  constructor(onEvent: EventCallback) {
    this.onEvent = onEvent;
  }

  start(): void {
    this.tryAttachReactNavigation();
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  attachToNavigation(navigationRef: {
    addListener: (
      event: string,
      callback: (e: {
        data?: { state?: { routes?: { name: string }[] } };
      }) => void
    ) => () => void;
  }): void {
    this.unsubscribe = navigationRef.addListener('state', (e) => {
      const routes = e.data?.state?.routes;
      if (routes && routes.length > 0) {
        const currentRoute = routes[routes.length - 1];
        if (currentRoute) {
          this.onEvent({
            timestamp: now(),
            type: 'navigation',
            label: currentRoute.name,
          });
        }
      }
    });
  }

  private tryAttachReactNavigation(): void {
    // React Navigation auto-detection is opt-in via attachToNavigation()
    // This is intentionally a no-op — the user must pass their navigation ref
    // to enable automatic navigation tracking
  }
}
