export type SystemClock = {
  timezone: string;
  simulated: boolean;
  simulatedTime: string | null;
  now: Date;
  today: string;
};

export const DEFAULT_TIMEZONE = "Asia/Dhaka"; // GMT+6

export function monthEnd(date: Date): Date {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date(); // Fallback safety
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function nextMonthStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function zonedNow(timezone: string): Date {
  try {
    return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  } catch (e) {
    return new Date(); // Fallback to UTC if timezone is invalid
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
