import { Env, SystemClock } from "./types";
import { DB } from "./db";

export const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const DEFAULT_TIMEZONE = "Asia/Dhaka";

export function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function escapeHtml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// --- Date Utils ---

export function zonedNow(timezone: string): Date {
  try { return new Date(new Date().toLocaleString("en-US", { timeZone: timezone })); } 
  catch (e) { return new Date(); }
}

export function formatDateOnly(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch (e) { return date.toISOString().split("T")[0]; }
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

export function addPaidMonths(paidThrough: Date, months: number): Date {
  let updated = monthEnd(paidThrough);
  for (let i = 0; i < months; i++) {
    updated = monthEnd(new Date(updated.getFullYear(), updated.getMonth() + 1, 1));
  }
  return updated;
}

export function formatMonthLabel(date: Date, today: Date = zonedNow(DEFAULT_TIMEZONE)): string {
  const monthName = date.toLocaleString("en-US", { month: "short" });
  return date.getFullYear() === today.getFullYear() ? monthName : `${monthName} ${date.getFullYear()}`;
}

// Optimized Dues Calculator
export function calcDueDetails(
  expiry: string | null | undefined,
  attendance: string[] | undefined,
  threshold: number,
  manualDue: number = 0,
  today: Date = zonedNow(DEFAULT_TIMEZONE)
): { count: number; months: Date[]; labels: string[] } {
  let dueMonths: Date[] = [];
  
  if (!expiry) {
    // Logic for brand new member without expiry set? Fallback to manual
  } else {
    const paidThrough = monthEnd(new Date(expiry));
    if (!isNaN(paidThrough.getTime())) {
      const attMap: Record<string, number> = {};
      for (const ts of attendance || []) {
        const d = new Date(ts);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        attMap[key] = (attMap[key] || 0) + 1;
      }

      let loopCount = 0;
      for (let cursor = nextMonthStart(paidThrough); cursor <= today; cursor = nextMonthStart(cursor)) {
        if (loopCount++ > 36) break; // Safety break
        const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
        if ((attMap[key] || 0) >= threshold) {
          dueMonths.push(new Date(cursor));
        }
      }
    }
  }

  // Add Manual Dues to the front
  if (manualDue > 0) {
    let cursor = dueMonths[0] ? new Date(dueMonths[0].getFullYear(), dueMonths[0].getMonth(), 1) : nextMonthStart(new Date(expiry || today));
    for (let i = 0; i < manualDue; i++) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      dueMonths.unshift(new Date(cursor));
    }
  }

  return { count: dueMonths.length, months: dueMonths, labels: dueMonths.map((d) => formatMonthLabel(d, today)) };
}

export async function loadSettings(env: Env) {
  // Kept for backward compat if needed, but GymService is preferred
  const db = new DB(env.DB);
  // ... (logic moved to GymService, avoiding duplication here)
  return {}; 
}
