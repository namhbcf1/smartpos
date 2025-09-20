export class SessionManager {
  private state: any;
  private env: any;

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/sessions") {
      // Get all sessions
      const sessions = await this.state.storage.list();
      return new Response(JSON.stringify({ success: true, data: Array.from(sessions.keys()) }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST" && url.pathname === "/create") {
      // Create new session
      const data = await request.json();
      const sessionId = crypto.randomUUID();
      await this.state.storage.put(sessionId, data);
      return new Response(JSON.stringify({ success: true, sessionId }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/session/")) {
      // Delete session
      const sessionId = url.pathname.split("/")[2];
      await this.state.storage.delete(sessionId);
      return new Response(JSON.stringify({ success: true, message: "Session deleted" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, message: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
}