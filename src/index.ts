import { Env } from "./types";
import { Router } from "./router";
import { DB } from "./db";
import { AuthController, DashboardController, MemberController, ActionController } from "./controllers";
import { CLIENT_JS } from "./client";

/* ========================================================================
   WORKER ENTRY POINT
   ======================================================================== */

const router = new Router();

// --- Middleware-ish Wrapper ---
async function withAuth(ctx: any, next: Function) {
  // Simple session check
  const cookie = ctx.req.headers.get("Cookie");
  const token = cookie?.match(/gym_auth=([^;]+)/)?.[1];
  if (token) {
    const db = new DB(ctx.env.DB);
    ctx.user = await db.first("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?", token);
  }
  return next(ctx);
}

// --- Route Definitions ---

// Static Assets (The Fix for "Nothing Loads")
router.get("/app.js", async () => new Response(CLIENT_JS, { headers: { "Content-Type": "application/javascript" } }));

// Public Routes
router.get("/", async (ctx) => withAuth(ctx, AuthController.renderLogin));
router.post("/api/login", AuthController.login);
router.post("/api/setup", AuthController.setup);
router.get("/api/logout", AuthController.logout);

// Protected Routes
router.get("/dashboard", async (ctx) => withAuth(ctx, DashboardController.render));

router.get("/api/bootstrap", async (ctx) => withAuth(ctx, DashboardController.bootstrap));
router.post("/api/members/add", async (ctx) => withAuth(ctx, MemberController.add));
router.post("/api/members/search", async (ctx) => withAuth(ctx, MemberController.search));
router.post("/api/members/delete", async (ctx) => withAuth(ctx, MemberController.delete));

router.post("/api/checkin", async (ctx) => withAuth(ctx, ActionController.checkIn));
router.post("/api/payment", async (ctx) => withAuth(ctx, ActionController.payment));
router.post("/api/members/renew", async (ctx) => withAuth(ctx, ActionController.payment)); // Reusing payment logic

router.get("/api/nuke", async (ctx) => {
  if (!ctx.user || ctx.user.role !== 'admin') return new Response("Forbidden", {status:403});
  await DB.nuke(ctx.env);
  return new Response("Reset Complete");
});

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    await DB.init(env); // Ensure tables exist
    return router.handle(req, env);
  }
};
