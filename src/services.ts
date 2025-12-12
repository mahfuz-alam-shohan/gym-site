import { Env, GymSettings, SystemClock } from "./types";
import { DB } from "./db";
import { 
  monthEnd, 
  addPaidMonths, 
  calcDueDetails, 
  zonedNow, 
  DEFAULT_TIMEZONE 
} from "./utils";

// Encapsulates complex business logic
export class GymService {
  private db: DB;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new DB(env.DB);
  }

  async loadSettings(): Promise<GymSettings> {
    const configRows = await this.db.all<{key: string, value: string}>("SELECT key, value FROM config");
    const configMap: Record<string, string> = {};
    for (const row of configRows) configMap[row.key] = row.value;

    const timezone = configMap["timezone"] || DEFAULT_TIMEZONE;
    const simEnabled = configMap["time_simulation_enabled"] === "true";
    const simValue = configMap["time_simulation_value"] || null;
    
    let clockNow = zonedNow(timezone);
    let simulated = false;
    if (simEnabled && simValue) {
      const parsed = new Date(simValue);
      if (!isNaN(parsed.getTime())) {
        clockNow = parsed;
        simulated = true;
      }
    }

    const clock: SystemClock = {
      timezone,
      simulated,
      simulatedTime: simulated ? clockNow.toISOString() : null,
      now: clockNow,
      today: clockNow.toISOString().split("T")[0], // Simple YYYY-MM-DD
    };

    let membershipPlans = [];
    try {
      const raw = JSON.parse(configMap["membership_plans"] || "[]");
      membershipPlans = Array.isArray(raw) ? raw.map(p => typeof p === 'string' ? {name: p, price:0, admissionFee:0} : p) : [];
    } catch { membershipPlans = [{name:"Standard", price:0, admissionFee:0}]; }

    return {
      configMap,
      attendanceThreshold: parseInt(configMap["attendance_threshold_days"] || "3", 10),
      inactiveAfterMonths: parseInt(configMap["inactive_after_due_months"] || "3", 10),
      renewalFee: parseInt(configMap["renewal_fee"] || "0", 10),
      currency: configMap["currency"] || "BDT",
      lang: configMap["lang"] || "en",
      membershipPlans,
      clock
    };
  }

  async getBootstrapData(userId: number) {
    const settings = await this.loadSettings();
    const { clock, attendanceThreshold, inactiveAfterMonths, membershipPlans } = settings;

    // Fetch essential data
    // Optimisation: Limit historical queries if needed, but keeping logic intact for correctness
    const members = await this.db.all("SELECT * FROM members ORDER BY id DESC");
    const attendanceAll = await this.db.all("SELECT member_id, check_in_time FROM attendance");
    
    const attendanceByMember: Record<number, string[]> = {};
    for (const a of attendanceAll) {
      if (!attendanceByMember[a.member_id]) attendanceByMember[a.member_id] = [];
      attendanceByMember[a.member_id].push(a.check_in_time);
    }

    const membersProcessed = [];
    let activeCount = 0, dueMembersCount = 0, inactiveMembersCount = 0, totalOutstanding = 0;

    for (const m of members) {
      const dueInfo = calcDueDetails(m.expiry_date, attendanceByMember[m.id], attendanceThreshold, m.manual_due_months || 0, clock.now);
      let newStatus = m.status || "active";

      if (dueInfo.count >= inactiveAfterMonths) {
        newStatus = "inactive";
        inactiveMembersCount++;
      } else if (dueInfo.count > 0) {
        newStatus = "due";
        dueMembersCount++;
      } else {
        newStatus = "active";
        activeCount++;
      }

      if (dueInfo.count > 0) {
        const plan = membershipPlans.find((p:any) => p.name === m.plan);
        const price = plan ? plan.price : 0;
        const owed = (dueInfo.count * price) - (m.balance || 0);
        totalOutstanding += Math.max(0, owed);
      }

      if (newStatus !== m.status) {
        await this.db.run("UPDATE members SET status = ? WHERE id = ?", newStatus, m.id);
      }

      membersProcessed.push({ ...m, status: newStatus, dueMonths: dueInfo.count, dueMonthLabels: dueInfo.labels });
    }

    const attendanceToday = await this.db.all(
      "SELECT a.check_in_time, a.status, m.name, m.id AS member_id FROM attendance a JOIN members m ON a.member_id = m.id WHERE date(a.check_in_time) = ? ORDER BY a.id DESC", 
      clock.today
    );

    const revenue = await this.db.first<{t: number}>("SELECT sum(amount) as t FROM payments");
    const todayVisits = await this.db.first<{c: number}>("SELECT count(*) as c FROM attendance WHERE date(check_in_time) = ?", clock.today);
    const user = await this.db.first("SELECT * FROM users WHERE id = ?", userId);

    return {
      user: user ? { ...user, permissions: JSON.parse(user.permissions || '[]') } : null,
      members: membersProcessed,
      attendanceToday,
      stats: { 
        active: activeCount, 
        today: todayVisits?.c || 0, 
        revenue: revenue?.t || 0, 
        dueMembers: dueMembersCount, 
        inactiveMembers: inactiveMembersCount, 
        totalOutstanding 
      },
      settings: { 
        attendanceThreshold, inactiveAfterMonths, membershipPlans, currency, 
        time: { timezone: clock.timezone, simulated: clock.simulated, simulatedTime: clock.simulatedTime, now: clock.now.toISOString() } 
      }
    };
  }

  async processPayment(memberId: number, amount: number, type: 'plan' | 'admission' | 'renewal' | 'wallet', settings: GymSettings) {
    if (amount <= 0 && type !== 'plan') return; // Allow 0 for plan if purely adjusting dates? No, generally require amount.

    await this.db.run("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)", memberId, amount, settings.clock.now.toISOString());

    if (type === 'admission') return; // Admission doesn't affect expiry logic usually

    const member = await this.db.first("SELECT * FROM members WHERE id = ?", memberId);
    if (!member) throw new Error("Member not found");

    const plan = settings.membershipPlans.find(p => p.name === member.plan);
    const price = plan ? Number(plan.price) : 0;

    let currentBalance = (member.balance || 0);
    // If it's a direct plan payment or wallet top-up, add to balance first
    if (amount > 0) currentBalance += amount;

    let expiry = monthEnd(new Date(member.expiry_date));
    let manualDue = member.manual_due_months || 0;

    // Renewal fee logic: just recording payment above. 
    // Usually renewal fees don't extend membership duration, but reset status?
    // User logic in original code treated renewal similar to plan payment if amount > 0 passed.
    // We will follow the core "Balance consumes Months" logic.

    if (price > 0) {
      // Consume balance to pay off manual dues
      while (manualDue > 0 && currentBalance >= price) {
        currentBalance -= price;
        manualDue -= 1;
        expiry = addPaidMonths(expiry, 1);
      }
      // Consume balance to extend future expiry
      while (currentBalance >= price) {
        currentBalance -= price;
        expiry = addPaidMonths(expiry, 1);
      }
    }

    const newStatus = (manualDue > 0) ? 'due' : 'active'; // Simple status update, bootstrap will refine it
    await this.db.run(
      "UPDATE members SET expiry_date = ?, balance = ?, status = ?, manual_due_months = ? WHERE id = ?", 
      expiry.toISOString(), currentBalance, newStatus, manualDue, memberId
    );
  }

  async checkIn(memberId: number) {
    const settings = await this.loadSettings();
    const member = await this.db.first("SELECT * FROM members WHERE id = ?", memberId);
    
    if (!member) throw new Error("Member not found");
    if (member.status === 'inactive') throw new Error("Membership Inactive");

    const already = await this.db.first(
      "SELECT id FROM attendance WHERE member_id = ? AND date(check_in_time) = ? LIMIT 1", 
      memberId, settings.clock.today
    );
    
    if (already) throw new Error("Already checked in today");

    const isExpired = new Date(member.expiry_date) < settings.clock.now;
    const status = isExpired ? 'expired' : 'success';

    await this.db.run(
      "INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)",
      memberId, settings.clock.now.toISOString(), status
    );

    return { status, name: member.name, isExpired };
  }
}
