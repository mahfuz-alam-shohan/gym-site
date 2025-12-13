import { getSession } from "./auth";
import { calculateDues, processPayment, getStreak } from "./attendance"; 
import { initDB, factoryReset } from "./db";
import { Env } from "./env";
import { hashPassword, verifyPassword } from "./security";
import { DEFAULT_TIMEZONE, monthEnd } from "./time";
import { loadSettings } from "./settings";
import { renderDashboard, renderLogin, renderSetup } from "./ui/pages";
import { corsHeaders, escapeHtml, errorResponse, json, validate } from "./utils";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      await initDB(env);

      /* --- PUBLIC ROUTES --- */
      if (url.pathname === "/") {
        const config = await env.DB.prepare("SELECT value FROM config WHERE key = 'gym_name'").first<any>();
        const user = await getSession(req, env);
        if (!config) return renderSetup();
        if (user) return Response.redirect(url.origin + "/dashboard", 302);
        return renderLogin(config.value as string);
      }

      if (url.pathname === "/api/setup" && req.method === "POST") {
        const body = await req.json() as any;
        const err = validate(body, ['gymName', 'adminName', 'email', 'password']);
        if(err) return errorResponse(err);

        const email = (body.email || "").trim().toLowerCase();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?)").bind(body.gymName).run();
        const hash = await hashPassword(body.password);
        await env.DB.prepare("DELETE FROM users").run(); 
        const allPerms = JSON.stringify(['home','members','attendance','history','payments','settings']);
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, 'admin', ?)").bind(email, hash, body.adminName, allPerms).run();
        
        const defaultPlans = JSON.stringify([{name:"Standard", price:500, admissionFee: 0}, {name:"Premium", price:1000, admissionFee: 0}]);
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('membership_plans', ?)").bind(defaultPlans).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('currency', ?)").bind("BDT").run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('lang', ?)").bind("en").run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('renewal_fee', ?)").bind("0").run();
        return json({ success: true });
      }

      if (url.pathname === "/api/login" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
        if (!user || !(await verifyPassword(body.password, user.password_hash))) return json({ error: "Invalid credentials" }, 401);
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expires).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` } });
      }

      if (url.pathname === "/api/logout") {
        return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" } });
      }

      /* --- PROTECTED ROUTES --- */
      const user = await getSession(req, env);
      if (!user) {
        if (url.pathname.startsWith('/api')) return json({ error: "Unauthorized" }, 401);
        return Response.redirect(url.origin + "/", 302);
      }

      if (url.pathname === "/dashboard") {
        const gymConfig = await env.DB.prepare("SELECT value FROM config WHERE key = 'gym_name'").first<any>();
        return renderDashboard(user, gymConfig?.value || "Gym OS");
      }

      // --- MAIN API ---

      if (url.pathname === "/api/bootstrap") {
        const settings = await loadSettings(env);
        const { attendanceThreshold, inactiveAfterMonths, membershipPlans, clock } = settings;

        const membersRaw = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC").all<any>();
        const attendanceAll = await env.DB.prepare("SELECT member_id, check_in_time FROM attendance").all<any>();
        
        const attendanceByMember: Record<number, string[]> = {};
        for (const a of attendanceAll.results || []) {
          if (!attendanceByMember[a.member_id]) attendanceByMember[a.member_id] = [];
          attendanceByMember[a.member_id].push(a.check_in_time);
        }

        const membersProcessed: any[] = [];
        let activeCount=0, dueMembersCount=0, inactiveMembersCount=0;
        let totalOutstanding = 0;

        for (const m of membersRaw.results || []) {
          const attTs = attendanceByMember[m.id] || [];
          const dueInfo = calculateDues(
            m.expiry_date,
            attTs,
            attendanceThreshold,
            m.manual_due_months || 0,
            clock.now
          );
          
          let newStatus = m.status || "active";
          if (dueInfo.count >= inactiveAfterMonths) { newStatus = "inactive"; inactiveMembersCount++; }
          else if (dueInfo.count > 0) { newStatus = "due"; dueMembersCount++; }
          else { newStatus = "active"; activeCount++; }
          
          // Money calc
          if (dueInfo.count > 0) {
              const planPrice = membershipPlans.find((p:any) => p.name === m.plan)?.price || 0;
              const owed = (dueInfo.count * planPrice) - (m.balance || 0);
              totalOutstanding += Math.max(0, owed);
          }
          
          if (newStatus !== m.status) await env.DB.prepare("UPDATE members SET status = ? WHERE id = ?").bind(newStatus, m.id).run();
          
          // Calculate Streak
          const streak = getStreak(attTs);

          membersProcessed.push({ 
             ...m, status: newStatus, 
             dueMonths: dueInfo.count, 
             dueMonthLabels: dueInfo.labels, 
             isRunningMonthPaid: dueInfo.isRunningMonthPaid,
             paidUntil: dueInfo.paidUntil,
             streak
          });
        }

        const attendanceToday = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id FROM attendance a JOIN members m ON a.member_id = m.id WHERE date(a.check_in_time) = ? ORDER BY a.id DESC").bind(clock.today).all<any>();
        
        // Leaderboard Logic
        const topVisitors = await env.DB.prepare(`
          SELECT m.name, count(a.id) as visits 
          FROM attendance a JOIN members m ON a.member_id = m.id 
          WHERE a.check_in_time > ? 
          GROUP BY m.id ORDER BY visits DESC LIMIT 5
        `).bind(new Date(new Date().setDate(1)).toISOString()).all(); // Current month leaderboard

        return json({
          user: { ...user, permissions: user.permissions ? JSON.parse(user.permissions) : [] },
          members: membersProcessed,
          attendanceToday: attendanceToday.results || [],
          topVisitors: topVisitors.results || [],
          stats: { active: activeCount, today: attendanceToday.results.length || 0, dueMembers: dueMembersCount, inactiveMembers: inactiveMembersCount, totalOutstanding },
          settings: { ...settings, clock: { timezone: clock.timezone, now: clock.now.toISOString() } }
        });
      }

      if (url.pathname === "/api/members/update-profile" && req.method === "POST") {
         const body = await req.json() as any;
         await env.DB.prepare("UPDATE members SET weight = ?, height = ?, gender = ?, notes = ? WHERE id = ?")
           .bind(body.weight, body.height, body.gender, body.notes, body.id).run();
         return json({success:true});
      }

      if (url.pathname === "/api/checkin" && req.method === "POST") {
        const settings = await loadSettings(env);
        const { memberId } = await req.json() as any;
        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        if (!member) return json({ error: "Member not found" }, 404);

        if (member.status === 'inactive') return json({ error: "Membership Inactive. Please Pay.", code: "INACTIVE" }, 400);

        const alreadyToday = await env.DB.prepare("SELECT id FROM attendance WHERE member_id = ? AND date(check_in_time) = ? LIMIT 1").bind(memberId, settings.clock.today).first();
        if (alreadyToday) return json({ error: "Already checked in today", code: "DUPLICATE" }, 400);
        
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)").bind(memberId, settings.clock.now.toISOString(), 'success').run();
        
        // Return streak info
        const att = await env.DB.prepare("SELECT check_in_time FROM attendance WHERE member_id = ?").bind(memberId).all<any>();
        const streak = getStreak((att.results||[]).map((a:any)=>a.check_in_time));
        
        return json({ success: true, name: member.name, streak });
      }

      // ... [Keep other standard routes for add/delete/payments as in previous logic but ensure they work with new structure] ...
      
      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const settings = await loadSettings(env);
        const body = await req.json() as any;
        let base = new Date(settings.clock.now);
        base.setMonth(base.getMonth() - 1, 1);
        let paidThrough = monthEnd(base);
        const result = await env.DB.prepare("INSERT INTO members (name, phone, plan, joined_at, expiry_date, manual_due_months, gender, weight, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id").bind(body.name, body.phone, body.plan, settings.clock.now.toISOString(), paidThrough.toISOString(), 0, body.gender||'other', body.weight||0, body.height||0).first<any>();
        
        if (body.initialPayment && result.id) {
             const amt = parseInt(body.initialPayment);
             await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(result.id, amt, settings.clock.now.toISOString()).run();
             // Simplistic initial processing
             const plan = (settings.membershipPlans || []).find((p: any) => p.name === body.plan);
             const price = plan ? Number(plan.price) : 0;
             const res = processPayment(paidThrough.toISOString(), [], amt, price, 0, 0, settings.attendanceThreshold, settings.clock.now);
             await env.DB.prepare("UPDATE members SET expiry_date = ?, balance = ? WHERE id = ?").bind(res.newExpiry, res.newBalance, result.id).run();
        }
        return json({ success: true });
      }
      
      if ((url.pathname === "/api/payment" || url.pathname === "/api/members/renew") && req.method === "POST") {
        const settings = await loadSettings(env);
        const { memberId, amount, renewalFee } = await req.json() as any;
        const amt = Number(amount || 0);
        const rFee = Number(renewalFee || 0);

        if (rFee > 0) await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, rFee, settings.clock.now.toISOString()).run();
        if (amt > 0) await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, amt, settings.clock.now.toISOString()).run();

        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        const att = await env.DB.prepare("SELECT check_in_time FROM attendance WHERE member_id = ?").bind(memberId).all<any>();
        const attTs = (att.results||[]).map((a:any) => a.check_in_time);
        
        const plan = (settings.membershipPlans || []).find((p: any) => p.name === member.plan);
        const price = plan ? Number(plan.price) : 0;

        const res = processPayment(
           member.expiry_date,
           attTs,
           amt,
           price,
           member.balance || 0,
           member.manual_due_months || 0,
           settings.attendanceThreshold,
           settings.clock.now
        );

        await env.DB.prepare("UPDATE members SET expiry_date = ?, balance = ?, manual_due_months = ?, status = 'active' WHERE id = ?").bind(res.newExpiry, res.newBalance, res.newManualDue, memberId).run();
        return json({ success: true });
      }
      
      if (url.pathname === "/api/members/search" && req.method === "POST") {
        const body = await req.json() as any;
        const qRaw = (body.query || "").toString().trim();
        if (!qRaw) return json({ results: [] });
        const res = await env.DB.prepare("SELECT id, name, phone, status FROM members WHERE name LIKE ? OR phone LIKE ? LIMIT 8").bind(`%${qRaw}%`, `%${qRaw}%`).all();
        return json({ results: res.results });
      }

      if (url.pathname === "/api/members/delete" && req.method === "POST") {
         const { id } = await req.json() as any;
         await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
         await env.DB.prepare("DELETE FROM attendance WHERE member_id = ?").bind(id).run();
         return json({ success: true });
      }
      
      if (url.pathname === "/api/nuke") {
        await factoryReset(env);
        return new Response("Reset Complete", { status: 200 });
      }

    } catch (e: any) { return json({ error: e.message }, 500); }
    return new Response("Not found", { status: 404 });
  }
};
