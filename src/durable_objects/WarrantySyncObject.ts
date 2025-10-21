export class WarrantySyncObject {
  private state: any;
  private sessions: Set<any> = new Set();
  constructor(state: any, env: any) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/websocket") {
      // WebSocket connection for warranty sync
      const webSocketPair = new (globalThis as any).WebSocketPair();
      const [client, server] = Object.values(webSocketPair) as any[];
      
      this.sessions.add(server);
      
      server.addEventListener('close', () => {
        this.sessions.delete(server);
      });

      server.addEventListener('error', () => {
        this.sessions.delete(server);
      });

      server.accept();
      server.send(JSON.stringify({
        type: 'connected',
        message: 'Warranty sync connected'
      }));

      return new Response(null, { status: 101, webSocket: client } as any);
    }

    if (request.method === "POST" && url.pathname === "/broadcast") {
      // Broadcast warranty updates
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