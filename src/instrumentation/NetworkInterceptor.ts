import type { PerfEvent } from '../types';
import { now } from '../utils/timestamp';

type EventCallback = (event: PerfEvent) => void;

export class NetworkInterceptor {
  private originalFetch: typeof fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
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

  private interceptXHR(): void {
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    const self = this;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...args: unknown[]
    ) {
      (this as XMLHttpRequest & { _perfMethod: string; _perfUrl: string })
        ._perfMethod = method;
      (this as XMLHttpRequest & { _perfUrl: string })._perfUrl =
        typeof url === 'string' ? url : url.toString();
      return self.originalXHROpen!.apply(
        this,
        [method, url, ...args] as Parameters<typeof XMLHttpRequest.prototype.open>
      );
    };

    XMLHttpRequest.prototype.send = function (body?: unknown) {
      const xhr = this as XMLHttpRequest & {
        _perfMethod: string;
        _perfUrl: string;
      };
      const label = `${xhr._perfMethod} ${xhr._perfUrl}`;
      const startTime = now();

      self.onEvent({
        timestamp: startTime,
        type: 'network_start',
        label,
      });

      const onEnd = () => {
        self.onEvent({
          timestamp: now(),
          type: 'network_end',
          label: `${label} (${xhr.status})`,
          duration: now() - startTime,
        });
      };

      xhr.addEventListener('load', onEnd);
      xhr.addEventListener('error', () => {
        self.onEvent({
          timestamp: now(),
          type: 'network_end',
          label: `${label} (error)`,
          duration: now() - startTime,
        });
      });

      return self.originalXHRSend!.call(this, body);
    };
  }

  private restoreFetch(): void {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }

  private restoreXHR(): void {
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      this.originalXHROpen = null;
    }
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
      this.originalXHRSend = null;
    }
  }
}
