import { Context } from "./types";
import { DB } from "./db";
import { GymService } from "./services";
import { json, errorResponse, validate, hashPassword, verifyPassword, loadSettings, monthEnd } from "./utils";
import { renderSetup, renderLogin, renderDashboard } from "./ui";

export class AuthController {
  static async renderLogin(ctx: Context) {
    const db = new DB(ctx.env.DB);
    const config = await db.first("SELECT value FROM config WHERE key = 'gym_name'");
    if (!config) return renderSetup();
    if (ctx.user) return Response.redirect(ctx.url.origin + "/dashboard", 302);
    return renderLogin(config.value as string);
  }

  static async setup(ctx: Context) {
    const body = await ctx.req.json() as any;
    const err = validate(body, ['gymName', 'adminName', 'email', 'password']);
    if (err) return errorResponse(err);

    const db = new DB(ctx.env.DB);
    const hash = await hashPassword(body.password);
    
    await db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?)", body.gymName);
    // Nuke users to ensure fresh admin
    await ctx.env.DB.prepare("DELETE FROM users").run(); 

    const allPerms = JSON.stringify(['home','members','attendance','history','payments','settings']);
    await db.run("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, 'admin', ?)", 
      body.email.trim().toLowerCase(), hash, body.adminName, allPerms);
    
    // Defaults
    await db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('membership_plans', ?)", JSON.stringify([{name:"Standard", price:500, admissionFee:0}]));
    await db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('currency', ?)", "BDT");
    
    return json({ success: true });
  }

  static async login(ctx: Context) {
    const body = await ctx.req.json() as any;
    const db = new DB(ctx.env.DB);
    const user = await db.first("SELECT * FROM users WHERE email = ?", (body.email || "").trim().toLowerCase());
    
    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", token, user.id, expires);

    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json", "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` } 
    });
  }

  static async logout(ctx: Context) {
    return new Response(null, { 
      status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" } 
    });
  }
}

export class DashboardController {
  static async render(ctx: Context) {
    if (!ctx.user) return Response.redirect(ctx.url.origin + "/", 302);
    return renderDashboard(ctx.user);
  }

  static async bootstrap(ctx: Context) {
    if (!ctx.user) return errorResponse("Unauthorized", 401);
    const service = new GymService(ctx.env);
    const data = await service.getBootstrapData(ctx.user.id);
    return json(data);
  }
}

export class MemberController {
  static async add(ctx: Context) {
    const service = new GymService(ctx.env);
    const settings = await service.loadSettings();
    const db = new DB(ctx.env.DB);
    const body = await ctx.req.json() as any;

    const isMigration = body.migrationMode === true || body.migrationMode === "true";
    const legacyDues = Math.max(0, parseInt(body.legacyDues || "0", 10));

    // Determine initial expiry
    const base = new Date(settings.clock.now);
    base.setMonth(base.getMonth() - 1, 1);
    let paidThrough = monthEnd(base);
    let manualDue = 0;

    if (isMigration) {
      const anchor = new Date(settings.clock.now);
      anchor.setMonth(anchor.getMonth() - legacyDues, 1);
      paidThrough = monthEnd(anchor);
      manualDue = legacyDues;
    }

    const res = await ctx.env.DB.prepare(
      "INSERT INTO members (name, phone, plan, joined_at, expiry_date, manual_due_months) VALUES (?, ?, ?, ?, ?, ?) RETURNING id"
    ).bind(body.name, body.phone, body.plan, settings.clock.now.toISOString(), paidThrough.toISOString(), manualDue).first<any>();

    const memberId = res.id;

    // Process Initial Payments
    const admFee = parseInt(body.admissionFee || "0");
    if (body.admissionFeePaid && admFee > 0) {
      await service.processPayment(memberId, admFee, 'admission', settings);
    }

    const initialAmt = parseInt(body.initialPayment || "0");
    if (initialAmt > 0) {
      await service.processPayment(memberId, initialAmt, 'plan', settings);
    }

    return json({ success: true, id: memberId });
  }

  static async search(ctx: Context) {
    const body = await ctx.req.json() as any;
    const service = new GymService(ctx.env);
    const settings = await service.loadSettings();
    const db = new DB(ctx.env.DB);
    
    const q = (body.query || "").toString().trim();
    if (!q) return json({ results: [] });

    // Efficient search query
    let query = "SELECT * FROM members WHERE ";
    const args = [];
    if (/^\d+$/.test(q)) {
      if (q.length < 5) { query += "CAST(id AS TEXT) LIKE ?"; args.push(`${q}%`); }
      else { query += "phone LIKE ?"; args.push(`%${q}%`); }
    } else {
      query += "name LIKE ?"; args.push(`%${q}%`);
    }
    query += " LIMIT 10";

    const members = await db.all(query, ...args);
    // Enrich with due status for search result cards
    // This part requires complex check, simplified for search speed or reuse calc logic
    // For now, returning raw, UI can fetch details if needed, or we compute basic
    return json({ results: members });
  }

  static async delete(ctx: Context) {
    const { id } = await ctx.req.json() as any;
    const db = new DB(ctx.env.DB);
    await db.run("DELETE FROM members WHERE id = ?", id);
    await db.run("DELETE FROM attendance WHERE member_id = ?", id);
    return json({ success: true });
  }
}

export class ActionController {
  static async checkIn(ctx: Context) {
    const { memberId } = await ctx.req.json() as any;
    const service = new GymService(ctx.env);
    try {
      const result = await service.checkIn(memberId);
      return json({ success: true, ...result });
    } catch (e: any) {
      return json({ error: e.message }, 400);
    }
  }

  static async payment(ctx: Context) {
    const body = await ctx.req.json() as any;
    const service = new GymService(ctx.env);
    const settings = await service.loadSettings();

    // Consolidated payment endpoint
    const type = body.paymentType || 'plan';
    const amount = parseInt(body.amount || "0");
    const renewalFee = parseInt(body.renewalFee || "0");

    if (renewalFee > 0) {
      await service.processPayment(body.memberId, renewalFee, 'renewal', settings);
    }

    await service.processPayment(body.memberId, amount, type, settings);
    return json({ success: true });
  }
}
