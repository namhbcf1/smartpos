type Topic = 'sales' | 'inventory' | 'system' | 'warranty';

export interface RealtimeOptions {
  wsUrl?: string;
  sseUrl?: string;
  topics?: Topic[];
  onEvent?: (evt: { type: string; topic?: Topic; data?: any }) => void;
  onStatus?: (status: 'connecting' | 'connected' | 'sse' | 'disconnected' | 'reconnecting') => void;
  maxBackoffMs?: number;
  getToken?: () => string | undefined;
}

export class RealtimeClient {
  private ws?: WebSocket;
  private es?: EventSource;
  private backoff = 1000;
  private readonly maxBackoff: number;
  private stopped = false;
  constructor(private opts: RealtimeOptions) {
    this.maxBackoff = opts.maxBackoffMs ?? 15000;
  }
  start() {
    this.stopped = false;
    this.connectWS();
  }
  stop() {
    this.stopped = true;
    this.ws?.close();
    this.es?.close();
  }
  private connectWS() {
    if (this.stopped) return;
    this.opts.onStatus?.('connecting');
    try {
      const envWs = (import.meta as any).env?.VITE_CLOUDFLARE_WS_URL as string | undefined;
      // Derive WS from API base if WS env missing
      let derivedWs: string | undefined;
      if (!envWs) {
        const apiBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
        if (apiBase) {
          try {
            const u = new URL(apiBase);
            // If api base includes /api/v1, keep host only
            const host = u.host;
            const protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
            derivedWs = `${protocol}//${host}/api/v1/ws`;
          } catch {}
        }
      }
      const url = this.opts.wsUrl || envWs || derivedWs || 'wss://namhbcf-api.bangachieu2.workers.dev/api/v1/ws';
      const token = this.opts.getToken?.();
      const wsUrl = token ? `${url}?t=${encodeURIComponent(token)}` : url;
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        this.backoff = 1000;
        this.opts.onStatus?.('connected');
      };
      this.ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (this.filterTopic(data)) this.opts.onEvent?.(data);
        } catch {}
      };
      this.ws.onclose = () => this.reconnect();
      this.ws.onerror = () => {
        try { this.ws?.close(); } catch {}
      };
    } catch {
      this.fallbackSSE();
    }
  }
  private fallbackSSE() {
    if (this.stopped) return;
    let url = this.opts.sseUrl;
    if (!url && this.opts.wsUrl) {
      // Derive SSE URL from WS URL if provided
      try {
        const u = new URL(this.opts.wsUrl);
        // Replace ws/wss with http/https and use /realtime by default
        u.protocol = u.protocol === 'wss:' ? 'https:' : 'http:';
        // Keep path if it already ends with /realtime or /sse, else default to /realtime
        if (!u.pathname || u.pathname === '/' || (!u.pathname.endsWith('/realtime') && !u.pathname.endsWith('/sse'))) {
          u.pathname = '/realtime';
        }
        url = u.toString();
      } catch {}
    }
    if (!url) {
      const envWs = (import.meta as any).env?.VITE_CLOUDFLARE_WS_URL as string | undefined;
      if (envWs) {
        try {
          const u = new URL(envWs);
          u.protocol = 'https:';
          // SSE stream under API v1
          u.pathname = '/api/v1/realtime-notifications/stream';
          url = u.toString();
        } catch {}
      } else {
        const apiBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
        if (apiBase) {
          try {
            const u = new URL(apiBase);
            url = `https://${u.host}/api/v1/realtime-notifications/stream`;
          } catch {}
        }
      }
    }
    if (!url) {
      // Fallback to relative only if nothing else provided
      url = `/realtime-notifications/stream`;
    }
    const token = this.opts.getToken?.();
    if (token) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}t=${encodeURIComponent(token)}`;
    }
    try {
      this.es = new EventSource(url);
      this.opts.onStatus?.('sse');
      this.es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (this.filterTopic(data)) this.opts.onEvent?.(data);
        } catch {}
      };
      this.es.onerror = () => this.reconnect();
    } catch {
      this.reconnect();
    }
  }
  private reconnect() {
    if (this.stopped) return;
    this.opts.onStatus?.('reconnecting');
    setTimeout(() => {
      this.backoff = Math.min(this.backoff * 2, this.maxBackoff);
      // Try WS first, then fallback to SSE
      this.connectWS();
      // If WS fails quickly, fallback will engage
      setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) this.fallbackSSE();
      }, 1000);
    }, this.backoff);
  }
  private filterTopic(data: any) {
    if (!this.opts.topics || this.opts.topics.length === 0) return true;
    const topic = data.topic || data.category || 'system';
    return this.opts.topics.includes(topic);
  }
}


