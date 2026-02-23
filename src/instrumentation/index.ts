import type { PerfEvent } from '../types';
import { NetworkInterceptor } from './NetworkInterceptor';
import { NavigationTracker } from './NavigationTracker';
import { JsTaskMonitor } from './JsTaskMonitor';

type EventCallback = (event: PerfEvent) => void;

export class AutoInstrumentation {
  private networkInterceptor: NetworkInterceptor;
  private navigationTracker: NavigationTracker;
  private jsTaskMonitor: JsTaskMonitor;

  constructor(onEvent: EventCallback) {
    this.networkInterceptor = new NetworkInterceptor(onEvent);
    this.navigationTracker = new NavigationTracker(onEvent);
    this.jsTaskMonitor = new JsTaskMonitor(onEvent);
  }

  start(): void {
    this.networkInterceptor.start();
    this.navigationTracker.start();
    this.jsTaskMonitor.start();
  }

  stop(): void {
    this.networkInterceptor.stop();
    this.navigationTracker.stop();
    this.jsTaskMonitor.stop();
  }

  getNavigationTracker(): NavigationTracker {
    return this.navigationTracker;
  }
}

export { NetworkInterceptor, NavigationTracker, JsTaskMonitor };
