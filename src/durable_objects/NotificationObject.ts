export class NotificationObject {
  private state: any;
  private sessions: Set<any> = new Set();

  constructor(state: any) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/websocket") {
      // WebSocket connection
      const webSocketPair = new (globalThis as any).WebSocketPair();
      const [client, server] = Object.values(webSocketPair) as any[];
      
      const sessionId = crypto.randomUUID();
      this.sessions.add(server);
      
      server.accept();
      
      server.addEventListener('message', async (event: any) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ping') {
            server.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      server.addEventListener('close', (event: any) => {
        this.sessions.delete(server);
      });

      server.addEventListener('error', (event: any) => {
        this.sessions.delete(server);
      });

      return new Response(null, {
        status: 101,
        webSocket: client
      } as any);
    }

    if (request.method === "POST" && url.pathname === "/broadcast") {
      // Broadcast message to all connected clients
      const data = await request.json();
      
      for (const session of this.sessions) {
        try {
          session.send(JSON.stringify(data));
        } catch (error) {
          this.sessions.delete(session);
        }
      }
      
      return new Response(JSON.stringify({ success: true, sentTo: this.sessions.size }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, message: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
}