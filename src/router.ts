import { Context, Handler, Env } from "./types";
import { errorResponse, corsHeaders } from "./utils";

type Route = {
  method: string;
  pattern: RegExp;
  handler: Handler;
};

export class Router {
  routes: Route[] = [];

  add(method: string, path: string, handler: Handler) {
    // Convert path parameters like :id to regex groups
    const regexPath = path.replace(/:([^\/]+)/g, '(?<$1>[^/]+)');
    this.routes.push({
      method,
      pattern: new RegExp(`^${regexPath}$`),
      handler,
    });
  }

  get(path: string, handler: Handler) { this.add("GET", path, handler); }
  post(path: string, handler: Handler) { this.add("POST", path, handler); }
  delete(path: string, handler: Handler) { this.add("DELETE", path, handler); }
  options(path: string, handler: Handler) { this.add("OPTIONS", path, handler); }

  async handle(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    for (const route of this.routes) {
      if (route.method !== req.method && route.method !== "ALL") continue;
      
      const match = url.pathname.match(route.pattern);
      if (match) {
        const params = match.groups || {};
        const ctx: Context = { req, env, url, params };
        try {
          return await route.handler(ctx);
        } catch (err: any) {
          console.error(`Route Error [${url.pathname}]:`, err);
          return errorResponse(err.message || "Internal Server Error", 500);
        }
      }
    }

    return errorResponse("Not Found", 404);
  }
}
