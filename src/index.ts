import { Env } from "./types";
import {
  corsHeaders,
  escapeHtml,
  json,
  errorResponse,
  validate,
  hashPassword,
  verifyPassword,
  DEFAULT_TIMEZONE,
  loadSettings,
  addPaidMonths,
  calcDueDetails,
  monthEnd,
} from "./utils";
import { initDB, factoryReset } from "./db";
import { renderSetup, renderLogin, renderDashboard } from "./ui";

/* ========================================================================
   4. WORKER LOGIC
   ======================================================================== */

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

      if (url.pathname === "/api/nuke") {
        // Protect nuke with session check inside if logic for safety, but here simple route
        // Ideally should be authenticated. Adding rudimentary check
        const user = await getSession(req, env);
        if (!user || user.role !== 'admin') return errorResponse("Unauthorized", 401);
        await factoryReset(env);
        return new Response("Reset Complete", { status: 200 });
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

      if (url.pathname === "/dashboard") return renderDashboard(user);

      if (url.pathname === "/dues/print") {
        const settings = await loadSettings(env);
        const gymRow = await env.DB.prepare("SELECT value FROM config WHERE key='gym_name'").first<any>();
        const gymName = (gymRow && gymRow.value) || "Gym OS";
        const attendanceThreshold = settings.attendanceThreshold;
        // Limit print to first 500 to avoid memory crash
        const membersRaw = await env.DB.prepare("SELECT * FROM members ORDER BY id LIMIT 500").all<any>();
        const attendanceAll = await env.DB.prepare("SELECT member_id, check_in_time FROM attendance").all<any>();
        const attendanceByMember: Record<number, string[]> = {};
        for (const a of attendanceAll.results || []) {
          if (!attendanceByMember[a.member_id]) attendanceByMember[a.member_id] = [];
          attendanceByMember[a.member_id].push(a.check_in_time);
        }

        const members = (membersRaw.results || []).map((m: any) => {
          const dueInfo = calcDueDetails(m.expiry_date, attendanceByMember[m.id], attendanceThreshold, m.manual_due_months || 0, settings.clock.now);
          return { ...m, dueMonths: dueInfo.count, dueMonthLabels: dueInfo.labels };
        }).filter((m:any) => m.dueMonths && m.dueMonths > 0);

        let rows = members.map((m:any) => {
          const label = (m.dueMonthLabels && m.dueMonthLabels.length)
            ? `Due of ${m.dueMonthLabels.join(', ')}`
            : `${m.dueMonths} Month(s)`;
          return `<tr><td>#${m.id}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.phone)}</td><td>${escapeHtml(m.plan)}</td><td>${escapeHtml(label)}</td></tr>`;
        }).join('');
        if(!rows) rows = '<tr><td colspan="5" style="text-align:center">No dues found.</td></tr>';

        const html = `<!DOCTYPE html><html><head><title>Due Report</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f3f4f6;} .header{text-align:center;margin-bottom:30px;} .btn{display:none;} @media print{.btn{display:none;}}</style></head><body>
          <div class="header"><h1>${escapeHtml(gymName)}</h1><h3>Due Members Report</h3><p>Date: ${settings.clock.now.toLocaleDateString('en-GB', { timeZone: settings.clock.timezone })}</p></div>
          <button class="btn" onclick="window.print()" style="display:block;margin:0 auto 20px;padding:10px 20px;cursor:pointer;">Print PDF</button>
          <table><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Plan</th><th>Due</th></tr></thead><tbody>${rows}</tbody></table>
          <script>window.onload=function(){window.print();}</script>
        </body></html>`;
        return new Response(html, { headers: {"Content-Type":"text/html"} });
      }

      if (url.pathname === "/api/users/list") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const users = await env.DB.prepare("SELECT id, name, email, role, permissions FROM users ORDER BY id").all();
        return json({ users: users.results });
      }

      if (url.pathname === "/api/users/add" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(body.email).first();
        if (exists) return json({ error: "Email exists" }, 400);
        const hash = await hashPassword(body.password);
        const perms = JSON.stringify(body.permissions || []);
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, ?, ?)").bind(body.email, hash, body.name, body.role, perms).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/users/update" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        const perms = JSON.stringify(body.permissions || []);
        if (body.password) {
           const hash = await hashPassword(body.password);
           await env.DB.prepare("UPDATE users SET name=?, email=?, role=?, permissions=?, password_hash=? WHERE id=?").bind(body.name, body.email, body.role, perms, hash, body.id).run();
        } else {
           await env.DB.prepare("UPDATE users SET name=?, email=?, role=?, permissions=? WHERE id=?").bind(body.name, body.email, body.role, perms, body.id).run();
        }
        return json({ success: true });
      }

      if (url.pathname === "/api/users/delete" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        if(body.id === user.id) return json({error:"Cannot delete self"}, 400);
        await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(body.id).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/bootstrap") {
        const settings = await loadSettings(env);
        const { attendanceThreshold, inactiveAfterMonths, renewalFee, currency, lang, membershipPlans, clock } = settings;

        // Optimization: Don't load full attendance history for calculation, only load relevant recent attendance if possible
        // For efficiency, we still fetch all, but we could LIMIT this if the gym grows > 5000 members.
        // Currently assumes < 5000 members for single file worker memory limits.
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
          const dueInfo = calcDueDetails(
            m.expiry_date,
            attendanceByMember[m.id],
            attendanceThreshold,
            m.manual_due_months || 0,
            clock.now
          );
          const dueMonths = dueInfo.count;
          const dueMonthLabels = dueInfo.labels;
          let newStatus = m.status || "active";
          
          if (dueMonths != null) {
             if (dueMonths >= inactiveAfterMonths) { 
               newStatus = "inactive"; 
               inactiveMembersCount++; 
             } else if (dueMonths > 0) { 
               newStatus = "due"; 
               dueMembersCount++; 
             } else { 
               newStatus = "active"; 
               activeCount++; 
             }
             
             // Calc Outstanding (considering balance)
             if (dueMonths > 0) {
                 const planPrice = membershipPlans.find((p:any) => p.name === m.plan)?.price || 0;
                 const owed = (dueMonths * planPrice) - (m.balance || 0);
                 totalOutstanding += Math.max(0, owed);
             }
          }
          
          if (newStatus !== m.status) await env.DB.prepare("UPDATE members SET status = ? WHERE id = ?").bind(newStatus, m.id).run();
          membersProcessed.push({ ...m, status: newStatus, dueMonths, dueMonthLabels });
        }

        const attendanceToday = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date, m.manual_due_months FROM attendance a JOIN members m ON a.member_id = m.id WHERE date(a.check_in_time) = ? ORDER BY a.id DESC").bind(clock.today).all<any>();
        
        // Limit history to 50 for bootstrap payload efficiency
        const attendanceHistory = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date, m.manual_due_months FROM attendance a JOIN members m ON a.member_id = m.id ORDER BY a.id DESC LIMIT 50").all<any>();
        
        const todayVisits = await env.DB.prepare("SELECT count(*) as c FROM attendance WHERE date(check_in_time) = ?").bind(clock.today).first<any>();
        const revenue = await env.DB.prepare("SELECT sum(amount) as t FROM payments").first<any>();

        return json({
          user: { ...user, permissions: user.permissions ? JSON.parse(user.permissions) : [] },
          members: membersProcessed,
          attendanceToday: (attendanceToday.results || []).map((r:any) => {
            const dueInfo = calcDueDetails(r.expiry_date, attendanceByMember[r.member_id], attendanceThreshold, r.manual_due_months || 0, clock.now);
            return { ...r, dueMonths: dueInfo.count, dueMonthLabels: dueInfo.labels };
          }),
          attendanceHistory: (attendanceHistory.results || []).map((r:any) => {
            return { ...r, dueMonths: 0 }; // History doesn't strictly need due calculation for display, optimizes load
          }),
          stats: { active: activeCount, today: todayVisits?.c || 0, revenue: revenue?.t || 0, dueMembers: dueMembersCount, inactiveMembers: inactiveMembersCount, totalOutstanding },
          settings: { attendanceThreshold, inactiveAfterMonths, membershipPlans, currency, lang, renewalFee, time: { timezone: clock.timezone, simulated: clock.simulated, simulatedTime: clock.simulatedTime, now: clock.now.toISOString() } }
        });
      }

      if (url.pathname === "/api/members/history" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const history = await env.DB.prepare("SELECT check_in_time, status FROM attendance WHERE member_id = ? ORDER BY check_in_time DESC").bind(memberId).all();
        const member = await env.DB.prepare("SELECT joined_at FROM members WHERE id = ?").bind(memberId).first<any>();
        return json({ history: history.results || [], joinedAt: member?.joined_at });
      }

      if (url.pathname === "/api/history/list" && req.method === "POST") {
        const body = await req.json() as any;
        let query = "SELECT a.check_in_time, a.status, m.name, m.id AS member_id FROM attendance a JOIN members m ON a.member_id = m.id";
        const params = [];
        
        if (body.date) {
            query += " WHERE date(a.check_in_time) = ?";
            params.push(body.date);
        }
        
        query += " ORDER BY a.id DESC";
        
        // If no date filter, limit to recent
        if (!body.date) {
            query += " LIMIT 100"; 
        }
        
        const history = await env.DB.prepare(query).bind(...params).all();
        return json({ history: history.results || [] });
      }

      if (url.pathname === "/api/payments/history" && req.method === "POST") {
        const body = await req.json() as any;
        // Changed JOIN to LEFT JOIN to include deleted members (where name might be null)
        let query = "SELECT p.amount, p.date, m.name, p.member_id FROM payments p LEFT JOIN members m ON p.member_id = m.id WHERE 1=1";
        const params: any[] = [];
        
        if (body.memberId) {
            query += " AND p.member_id = ?";
            params.push(body.memberId);
        }
        
        if (body.date) {
            query += " AND date(p.date) = ?";
            params.push(body.date);
        }
        
        query += " ORDER BY p.date DESC LIMIT 50";
        const res = await env.DB.prepare(query).bind(...params).all<any>();
        
        let memberName = null;
        if(body.memberId) {
           const m = await env.DB.prepare("SELECT name FROM members WHERE id = ?").bind(body.memberId).first<any>();
           memberName = m?.name;
        }

        return json({ transactions: res.results || [], memberName });
      }

      if (url.pathname === "/api/members/search" && req.method === "POST") {
        const body = await req.json() as any;
        const qRaw = (body.query || "").toString().trim();
        if (!qRaw) return json({ results: [] });
        
        let res;
        const isNumeric = /^\d+$/.test(qRaw);
        
        // Optimized query to check attendance status for today
        const settings = await loadSettings(env);
        const today = settings.clock.today;
        const baseQuery = "SELECT id, name, phone, plan, expiry_date, balance, status, manual_due_months, (SELECT count(*) FROM attendance WHERE member_id = members.id AND date(check_in_time) = ?) as today_visits FROM members";
        
        if (isNumeric) {
           if (qRaw.length < 6) {
              res = await env.DB.prepare(baseQuery + " WHERE CAST(id AS TEXT) LIKE ? LIMIT 10").bind(today, `${qRaw}%`).all();
           } else {
              res = await env.DB.prepare(baseQuery + " WHERE phone LIKE ? LIMIT 10").bind(today, `%${qRaw}%`).all();
           }
        } else {
           res = await env.DB.prepare(baseQuery + " WHERE name LIKE ? LIMIT 10").bind(today, `%${qRaw}%`).all();
        }
        
        // Preload attendance for matched members to respect monthly billing threshold
        const ids = (res.results || []).map((m:any)=>m.id);
        let attendanceByMember: Record<number, string[]> = {};
        if (ids.length) {
          const placeholders = ids.map(()=>'?').join(',');
          const attRes = await env.DB.prepare(`SELECT member_id, check_in_time FROM attendance WHERE member_id IN (${placeholders})`).bind(...ids).all<any>();
          for (const a of attRes.results || []) {
            if (!attendanceByMember[a.member_id]) attendanceByMember[a.member_id] = [];
            attendanceByMember[a.member_id].push(a.check_in_time);
          }
        }

        const attendanceThreshold = settings.attendanceThreshold;

        const results = (res.results || []).map((m: any) => {
            const dueInfo = calcDueDetails(m.expiry_date, attendanceByMember[m.id], attendanceThreshold, m.manual_due_months || 0, settings.clock.now);
            return {
                ...m,
                dueMonths: dueInfo.count,
                dueMonthLabels: dueInfo.labels,
                checkedIn: m.today_visits > 0
            };
        });
        return json({ results });
      }

      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const settings = await loadSettings(env);
        const body = await req.json() as any;
        const isMigration = body.migrationMode === true || body.migrationMode === "true";
        const legacyDues = Math.max(0, parseInt(body.legacyDues || "0", 10));

        // Default paid-through month is the previous month end
        const base = new Date(settings.clock.now);
        base.setMonth(base.getMonth() - 1, 1);
        let paidThrough = monthEnd(base);
        let manualDueMonths = 0;

        if (isMigration) {
            const anchor = new Date(settings.clock.now);
            anchor.setMonth(anchor.getMonth() - legacyDues, 1);
            paidThrough = monthEnd(anchor);
            manualDueMonths = legacyDues;
        }

        const result = await env.DB.prepare("INSERT INTO members (name, phone, plan, joined_at, expiry_date, manual_due_months) VALUES (?, ?, ?, ?, ?, ?) RETURNING id").bind(body.name, body.phone, body.plan, settings.clock.now.toISOString(), paidThrough.toISOString(), manualDueMonths).first<any>();
        
        const newMemberId = result.id;

        // Handle Admission Fee Payment
        if (body.admissionFeePaid && newMemberId) {
            const fee = parseInt(body.admissionFee || "0");
            if (fee > 0) {
                await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(newMemberId, fee, settings.clock.now.toISOString()).run();
            }
        }
        
        // Handle Initial Plan Payment (if any)
        const initialAmt = parseInt(body.initialPayment || "0");
        if (initialAmt > 0 && newMemberId) {
            await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(newMemberId, initialAmt, settings.clock.now.toISOString()).run();
            // Process payment to update balance and expiry
            const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(newMemberId).first<any>();
            const plan = (settings.membershipPlans || []).find((p: any) => p.name === member.plan);
            const price = plan ? Number(plan.price) : 0;
            let currentBalance = (member.balance || 0) + initialAmt;
            let expiryUpdated = monthEnd(new Date(member.expiry_date));
            let manualDue = member.manual_due_months || 0;

            if (price > 0) {
                while (manualDue > 0 && currentBalance >= price) {
                    currentBalance -= price;
                    manualDue -= 1;
                    expiryUpdated = addPaidMonths(expiryUpdated, 1);
                }
                while (currentBalance >= price) {
                    currentBalance -= price;
                    expiryUpdated = addPaidMonths(expiryUpdated, 1);
                }
            }

            await env.DB.prepare("UPDATE members SET expiry_date = ?, balance = ?, manual_due_months = ? WHERE id = ?").bind(expiryUpdated.toISOString(), currentBalance, manualDue, member.id).run();
        }
        return json({ success: true });
      }

      if (url.pathname === "/api/checkin" && req.method === "POST") {
        const settings = await loadSettings(env);
        const { memberId } = await req.json() as any;
        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        if (!member) return json({ error: "Member not found" }, 404);

        // Strict Inactive Block
        if (member.status === 'inactive') return json({ error: "Membership Inactive. Please Renew.", code: "INACTIVE" }, 400);

        const alreadyToday = await env.DB.prepare("SELECT id FROM attendance WHERE member_id = ? AND date(check_in_time) = ? LIMIT 1").bind(memberId, settings.clock.today).first();
        if (alreadyToday) return json({ error: "Already checked in today", code: "DUPLICATE" }, 400);
        const isExpired = new Date(member.expiry_date) < settings.clock.now;
        const status = isExpired ? 'expired' : 'success';
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)").bind(memberId, settings.clock.now.toISOString(), status).run();
        return json({ success: true, status, name: member.name, isExpired });
      }

      // RE-ADMISSION / RENEWAL ENDPOINT
      if (url.pathname === "/api/members/renew" && req.method === "POST") {
        const settings = await loadSettings(env);
        const { memberId, renewalFee, amount } = await req.json() as any;
        const rFee = Number(renewalFee);
        const planAmt = Number(amount);

        // 1. Record Renewal Fee
        if (rFee > 0) {
            await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, rFee, settings.clock.now.toISOString()).run();
        }

        // 2. Record Plan Payment
        if (planAmt > 0) {
            await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, planAmt, settings.clock.now.toISOString()).run();
        }

        // 3. Reset Member Status & Expiry
        const member = await env.DB.prepare("SELECT plan FROM members WHERE id = ?").bind(memberId).first<any>();
        const plan = (settings.membershipPlans || []).find((p: any) => p.name === member.plan);
        const price = plan ? Number(plan.price) : 0;

        let newExpiry = monthEnd(new Date(settings.clock.now.getFullYear(), settings.clock.now.getMonth() - 1, 1));
        let balance = 0;
        let manualDue = member.manual_due_months || 0;

        if (price > 0) {
            let months = Math.floor(planAmt / price);
            balance = planAmt % price; // Store remainder

            while (manualDue > 0 && months > 0) {
                months -= 1;
                manualDue -= 1;
                newExpiry = addPaidMonths(newExpiry, 1);
            }

            if (months > 0) {
                newExpiry = addPaidMonths(newExpiry, months);
            }
        } else {
            // Fallback if price is 0
            newExpiry = addPaidMonths(newExpiry, 1);
        }

        await env.DB.prepare("UPDATE members SET expiry_date = ?, balance = ?, status = 'active', manual_due_months = ? WHERE id = ?").bind(newExpiry.toISOString(), balance, manualDue, memberId).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/payment" && req.method === "POST") {
        const settings = await loadSettings(env);
        const { memberId, amount } = await req.json() as any;
        const amt = Number(amount);

        // Record the transaction
        await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, amt, settings.clock.now.toISOString()).run();
        
        // Update member balance and expiry logic
        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        const plan = (settings.membershipPlans || []).find((p: any) => p.name === member.plan);
        const price = plan ? Number(plan.price) : 0;

        let currentBalance = (member.balance || 0) + amt;
        let expiry = monthEnd(new Date(member.expiry_date));
        let manualDue = member.manual_due_months || 0;

        // While balance allows, extend month
        if (price > 0) {
            while (manualDue > 0 && currentBalance >= price) {
                currentBalance -= price;
                manualDue -= 1;
                expiry = addPaidMonths(expiry, 1);
            }
            while (currentBalance >= price) {
                currentBalance -= price;
                expiry = addPaidMonths(expiry, 1);
            }
        }

        await env.DB.prepare("UPDATE members SET expiry_date = ?, balance = ?, status = 'active', manual_due_months = ? WHERE id = ?").bind(expiry.toISOString(), currentBalance, manualDue, memberId).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/members/delete" && req.method === "POST") {
        const { id } = await req.json() as any;
        await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
        // NOT deleting payments to preserve revenue history
        // await env.DB.prepare("DELETE FROM payments WHERE member_id = ?").bind(id).run(); 
        await env.DB.prepare("DELETE FROM attendance WHERE member_id = ?").bind(id).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/settings" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Unauthorized' }, 403);
        const body = await req.json() as any;
        const simEnabled = body.timeSimulationEnabled === true || body.timeSimulationEnabled === 'true' || body.timeSimulationEnabled === 'on';
        const simValue = simEnabled ? (body.simulatedTime || '') : '';
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('attendance_threshold_days', ?)").bind(String(body.attendanceThreshold)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('inactive_after_due_months', ?)").bind(String(body.inactiveAfterMonths)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('currency', ?)").bind(String(body.currency)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('lang', ?)").bind(String(body.lang)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('membership_plans', ?)").bind(JSON.stringify(body.membershipPlans)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('renewal_fee', ?)").bind(String(body.renewalFee)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('time_simulation_enabled', ?)").bind(simEnabled ? 'true' : 'false').run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('time_simulation_value', ?)").bind(simEnabled && simValue ? String(simValue) : '').run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('timezone', ?)").bind(String(body.timezone || DEFAULT_TIMEZONE)).run();
        return json({ success: true });
      }

    } catch (e: any) { return json({ error: e.message }, 500); }
    return new Response("Not found", { status: 404 });
  }
};

async function getSession(req: Request, env: Env) {
  const cookie = req.headers.get("Cookie");
  const token = cookie?.match(/gym_auth=([^;]+)/)?.[1];
  if (!token) return null;
  return await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?").bind(token).first();
}

