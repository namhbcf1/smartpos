/**
 * NotificationManager Durable Object
 * Handles real-time notifications and WebSocket connections
 */

export class NotificationManager {
  private state: any;
  private env: any;
  private sessions: Map<string, any> = new Map();
  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      return this.handleWebSocket(request);
    }

    if (url.pathname === '/broadcast') {
      return this.handleBroadcast(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const webSocketPair = new (globalThis as any).WebSocketPair();
    const [client, server] = Object.values(webSocketPair) as any[];

    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, server);

    (server as any).accept();
    (server as any).addEventListener('message', (event: any) => {
      try {
        const data = JSON.parse(event.data as string);
        
        // Echo back for now
        server.send(JSON.stringify({
          type: 'echo',
          data: data,
          timestamp: new Date().toISOString();
        }));
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    (server as any).addEventListener('close', () => {
      this.sessions.delete(sessionId);
    });

    (server as any).addEventListener('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.sessions.delete(sessionId);
    });

    return new Response(null, {
      status: 101,
      webSocket: client as any,
    } as any);
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const data = await request.json();
      // Broadcast to all connected sessions
      for (const [sessionId, socket] of this.sessions) {
        try {
          socket.send(JSON.stringify({
            type: 'broadcast',
            data: data,
            timestamp: new Date().toISOString();
          }));
        } catch (error) {
          console.error(`Failed to send to session ${sessionId}:`, error);
          this.sessions.delete(sessionId);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Broadcast sent to ${this.sessions.size} sessions`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Broadcast failed',
        error: (error instanceof Error ? error.message : 'Unknown error')
       }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

