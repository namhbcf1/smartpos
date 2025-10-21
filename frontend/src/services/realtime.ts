// Simple Realtime client for Cloudflare Durable Object WS

export type RealtimeMessage = {
  type?: string;
  event?: string;
  data?: any;
  [key: string]: any;
};

export type RealtimeConnection = {
  socket: WebSocket;
  disconnect: () => void;
};

function normalizeWsUrl(rawUrl?: string): string {
  const url = rawUrl || import.meta.env.VITE_CLOUDFLARE_WS_URL || '';
  if (!url) return '';
  // Ensure ends with /ws
  return url.endsWith('/ws') ? url : `${url.replace(/\/$/, '')}/ws`;
}

export function connectRealtime(
  onMessage: (msg: RealtimeMessage) => void,
  onOpen?: () => void,
  onError?: (err: Event) => void,
  onClose?: () => void
): RealtimeConnection | null {
  const wsUrl = normalizeWsUrl();
  if (!wsUrl) return null;

  const socket = new WebSocket(wsUrl);

  socket.addEventListener('open', () => {
    onOpen && onOpen();
  });

  socket.addEventListener('message', (event) => {
    try {
      const parsed = JSON.parse(event.data as string);
      onMessage(parsed);
    } catch {
      // Ignore non-JSON messages
    }
  });

  socket.addEventListener('error', (e) => {
    onError && onError(e);
  });

  socket.addEventListener('close', () => {
    onClose && onClose();
  });

  return {
    socket,
    disconnect: () => {
      try { socket.close(); } catch {}
    }
  };
}

