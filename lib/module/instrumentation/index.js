"use strict";

import { NetworkInterceptor } from "./NetworkInterceptor.js";
import { NavigationTracker } from "./NavigationTracker.js";
import { JsTaskMonitor } from "./JsTaskMonitor.js";
export class AutoInstrumentation {
  constructor(onEvent) {
    this.networkInterceptor = new NetworkInterceptor(onEvent);
    this.navigationTracker = new NavigationTracker(onEvent);
    this.jsTaskMonitor = new JsTaskMonitor(onEvent);
  }
  start() {
    this.networkInterceptor.start();
    this.navigationTracker.start();
    this.jsTaskMonitor.start();
  }
  stop() {
    this.networkInterceptor.stop();
    this.navigationTracker.stop();
    this.jsTaskMonitor.stop();
  }
  getNavigationTracker() {
    return this.navigationTracker;
  }
}
export { NetworkInterceptor, NavigationTracker, JsTaskMonitor };
//# sourceMappingURL=index.js.map