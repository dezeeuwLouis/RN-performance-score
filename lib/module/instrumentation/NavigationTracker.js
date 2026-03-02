"use strict";

import { now } from "../utils/timestamp.js";
export class NavigationTracker {
  unsubscribe = null;
  constructor(onEvent) {
    this.onEvent = onEvent;
  }
  start() {
    this.tryAttachReactNavigation();
  }
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  attachToNavigation(navigationRef) {
    this.unsubscribe = navigationRef.addListener('state', e => {
      const routes = e.data?.state?.routes;
      if (routes && routes.length > 0) {
        const currentRoute = routes[routes.length - 1];
        if (currentRoute) {
          this.onEvent({
            timestamp: now(),
            type: 'navigation',
            label: currentRoute.name
          });
        }
      }
    });
  }
  tryAttachReactNavigation() {
    // React Navigation auto-detection is opt-in via attachToNavigation()
    // This is intentionally a no-op — the user must pass their navigation ref
    // to enable automatic navigation tracking
  }
}
//# sourceMappingURL=NavigationTracker.js.map