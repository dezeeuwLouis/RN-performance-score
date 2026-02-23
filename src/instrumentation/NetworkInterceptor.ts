import type { PerfEvent } from '../types';
import { now } from '../utils/timestamp';

type EventCallback = (event: PerfEvent) => void;

export class NetworkInterceptor {
  private originalFetch: typeof fetch | null = null;
  private onEvent: EventCallback;
  private active: boolean = false;

  constructor(onEvent: EventCallback) {
    this.onEvent = onEvent;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    // Only intercept fetch — in React Native, fetch is built on XHR,
    // so intercepting both would produce duplicate events.
    this.interceptFetch();
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    this.restoreFetch();
  }

  private interceptFetch(): void {
    this.originalFetch = global.fetch;
    const self = this;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    global.fetch = function (this: unknown, input: RequestInfo | URL, init?: RequestInit) {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const method = init?.method ?? 'GET';
      const label = `${method} ${url}`;
      const startTime = now();

      self.onEvent({
        timestamp: startTime,
        type: 'network_start',
        label,
      });

      return self.originalFetch!.call(this, input, init).then(
        (response) => {
          self.onEvent({
            timestamp: now(),
            type: 'network_end',
            label: `${label} (${response.status})`,
            duration: now() - startTime,
          });
          return response;
        },
        (error) => {
          self.onEvent({
            timestamp: now(),
            type: 'network_end',
            label: `${label} (error)`,
            duration: now() - startTime,
          });
          throw error;
        }
      );
    } as typeof fetch;
  }

  private restoreFetch(): void {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }

}
