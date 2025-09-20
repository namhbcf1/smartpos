export class POSSyncObject {
  private state: any;
  private sessions: Set<any> = new Set();

  constructor(state: any) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/websocket") {
      // WebSocket connection for POS sync
      const webSocketPair = new (globalThis as any).WebSocketPair();
      const [client, server] = Object.values(webSocketPair) as any[];
      
      this.sessions.add(server);
      server.accept();
      
      server.addEventListener('message', async (event: any) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pos_update') {
            // Broadcast to all other sessions
            for (const session of this.sessions) {
              if (session !== server) {
                session.send(JSON.stringify(data));
              }
            }
          }
        } catch (error) {
          console.error('POS sync error:', error);
        }
      });

      server.addEventListener('close', () => {
        this.sessions.delete(server);
      });

      server.addEventListener('error', () => {
        this.sessions.delete(server);
      });

      return new Response(null, {
        status: 101,
        webSocket: client
      } as any);
    }

    return new Response(JSON.stringify({ success: false, message: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
}