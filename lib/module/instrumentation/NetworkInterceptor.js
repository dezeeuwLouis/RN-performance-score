"use strict";

import { now } from "../utils/timestamp.js";
export class NetworkInterceptor {
  originalFetch = null;
  active = false;
  constructor(onEvent) {
    this.onEvent = onEvent;
  }
  start() {
    if (this.active) return;
    this.active = true;
    // Only intercept fetch — in React Native, fetch is built on XHR,
    // so intercepting both would produce duplicate events.
    this.interceptFetch();
  }
  stop() {
    if (!this.active) return;
    this.active = false;
    this.restoreFetch();
  }
  interceptFetch() {
    this.originalFetch = global.fetch;
    const self = this;
    global.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? 'GET';
      const label = `${method} ${url}`;
      const startTime = now();
      self.onEvent({
        timestamp: startTime,
        type: 'network_start',
        label
      });
      return self.originalFetch.call(this, input, init).then(response => {
        self.onEvent({
          timestamp: now(),
          type: 'network_end',
          label: `${label} (${response.status})`,
          duration: now() - startTime
        });
        return response;
      }, error => {
        self.onEvent({
          timestamp: now(),
          type: 'network_end',
          label: `${label} (error)`,
          duration: now() - startTime
        });
        throw error;
      });
    };
  }
  restoreFetch() {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }
}
//# sourceMappingURL=NetworkInterceptor.js.map