import { Env, SystemClock } from "./types";

export const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function escapeHtml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function validate(body: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

export const DEFAULT_TIMEZONE = "Asia/Dhaka";

export function zonedNow(timezone: string): Date {
  try {
    return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  } catch (e) {
    return new Date();
  }
}

export function formatDateOnly(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch (e) {
    return date.toISOString().split("T")[0];
  }
}

export function monthEnd(date: Date): Date {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function nextMonthStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatMonthLabel(date: Date, today: Date = zonedNow(DEFAULT_TIMEZONE)): string {
  const monthName = date.toLocaleString("en-US", { month: "short" });
  const currentYear = today.getFullYear();
  return date.getFullYear() === currentYear ? monthName : `${monthName} ${date.getFullYear()}`;
}

export function buildAttendanceMonthMap(attendance?: string[]): Record<string, Set<number>> {
  const map: Record<string, Set<number>> = {};
  for (const ts of attendance || []) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map[key]) map[key] = new Set();
    map[key].add(d.getDate());
  }
  return map;
}

export function buildManualDueMonths(manualDue: number, today: Date = zonedNow(DEFAULT_TIMEZONE)): Date[] {
  if (!manualDue || manualDue <= 0) return [];
  const months: Date[] = [];
  const anchor = new Date(today);
  anchor.setDate(1);

  for (let i = manualDue - 1; i >= 0; i--) {
    months.push(new Date(anchor.getFullYear(), anchor.getMonth() - i, 1));
  }
  return months;
}

export function calcDueDetails(
  expiry: string | null | undefined,
  attendance: string[] | undefined,
  threshold: number,
  manualDue: number = 0,
  today: Date = zonedNow(DEFAULT_TIMEZONE)
): { count: number; months: Date[]; labels: string[] } {
  let dueMonths: Date[] = [];

  if (!expiry) {
    dueMonths = buildManualDueMonths(manualDue, today);
    return { count: manualDue, months: dueMonths, labels: dueMonths.map((d) => formatMonthLabel(d, today)) };
  }

  const paidThrough = monthEnd(new Date(expiry));

  if (isNaN(paidThrough.getTime())) {
    dueMonths = buildManualDueMonths(manualDue, today);
    return { count: manualDue, months: dueMonths, labels: dueMonths.map((d) => formatMonthLabel(d, today)) };
  }

  const attMap = buildAttendanceMonthMap(attendance);
  const todayCopy = new Date(today);

  let loopCount = 0;
  for (let cursor = nextMonthStart(paidThrough); cursor <= todayCopy; cursor = nextMonthStart(cursor)) {
    loopCount++;
    if (loopCount > 36) break;

    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    const days = attMap[key]?.size || 0;

    if (days >= threshold) {
      dueMonths.push(new Date(cursor));
    }
  }

  if (manualDue > 0) {
    let cursor = dueMonths[0] ? new Date(dueMonths[0].getFullYear(), dueMonths[0].getMonth(), 1) : nextMonthStart(paidThrough);
    for (let i = 0; i < manualDue; i++) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      dueMonths.unshift(new Date(cursor));
    }
  }

  return { count: dueMonths.length, months: dueMonths, labels: dueMonths.map((d) => formatMonthLabel(d, today)) };
}

export function addPaidMonths(paidThrough: Date, months: number): Date {
  let updated = monthEnd(paidThrough);
  for (let i = 0; i < months; i++) {
    updated = monthEnd(new Date(updated.getFullYear(), updated.getMonth() + 1, 1));
  }
  return updated;
}

export async function loadSettings(env: Env): Promise<{
  configMap: Record<string, string>;
  attendanceThreshold: number;
  inactiveAfterMonths: number;
  renewalFee: number;
  currency: string;
  lang: string;
  membershipPlans: any[];
  clock: SystemClock;
}> {
  const configRows = await env.DB.prepare("SELECT key, value FROM config").all<any>();
  const configMap: Record<string, string> = {};
  for (const row of configRows.results || []) configMap[row.key] = row.value;

  const timezone = configMap["timezone"] || DEFAULT_TIMEZONE;
  const attendanceThreshold = parseInt(configMap["attendance_threshold_days"] || "3", 10);
  const inactiveAfterMonths = parseInt(configMap["inactive_after_due_months"] || "3", 10);
  const renewalFee = parseInt(configMap["renewal_fee"] || "0", 10);
  const currency = configMap["currency"] || "BDT";
  const lang = configMap["lang"] || "en";

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
    today: formatDateOnly(clockNow, timezone),
  };

  let membershipPlans: any[] = [];
  try {
    const raw = JSON.parse(configMap["membership_plans"] || "[]");
    if (Array.isArray(raw)) {
      membershipPlans = raw.map((p) => (typeof p === "string" ? { name: p, price: 0, admissionFee: 0 } : p));
    }
  } catch {
    membershipPlans = [{ name: "Standard", price: 0, admissionFee: 0 }];
  }

  return {
    configMap,
    attendanceThreshold,
    inactiveAfterMonths,
    renewalFee,
    currency,
    lang,
    membershipPlans,
    clock,
  };
}
