export class InventoryState {
  private state: any;
  private env: any;

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/state") {
      // Get inventory state
      const state = await this.state.storage.get("inventory") || {};
      return new Response(JSON.stringify({ success: true, data: state }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST" && url.pathname === "/update") {
      // Update inventory state
      const data = await request.json();
      await this.state.storage.put("inventory", data);
      return new Response(JSON.stringify({ success: true, message: "Inventory updated" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, message: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
}