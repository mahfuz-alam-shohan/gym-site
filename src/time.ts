// STRICT GMT+6 Timezone Handling for Bangladesh
export type SystemClock = {
  timezone: string;
  simulated: boolean;
  simulatedTime: string | null;
  now: Date;
  today: string;
};

export const DEFAULT_TIMEZONE = "Asia/Dhaka";
export const BD_OFFSET_HOURS = 6;

// Get current time in BD as a Date object
export function getBdDate(date: Date = new Date()): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * BD_OFFSET_HOURS));
}

export function zonedNow(timezone: string = DEFAULT_TIMEZONE): Date {
  return new Date();
}

// Returns YYYY-MM-DD string in BD Time
export function formatDateOnly(date: Date): string {
  const bd = getBdDate(date);
  const y = bd.getFullYear();
  const m = String(bd.getMonth() + 1).padStart(2, '0');
  const d = String(bd.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Returns YYYY-MM string for grouping attendance
export function formatMonthKey(date: Date): string {
  const bd = getBdDate(date);
  return `${bd.getFullYear()}-${bd.getMonth()}`; // 0-indexed month
}

// Returns the END of the given month (Last millisecond) in BD time, converted back to UTC ISO
export function monthEnd(date: Date): Date {
  const bd = getBdDate(date);
  // Set to next month's 0th day (which is this month's last day)
  const endBd = new Date(bd.getFullYear(), bd.getMonth() + 1, 0, 23, 59, 59, 999);
  // Convert back to real UTC for storage
  return new Date(endBd.getTime() - (3600000 * BD_OFFSET_HOURS));
}

// Get the 1st day of the NEXT month
export function nextMonthStart(date: Date): Date {
  const bd = getBdDate(date);
  // Set to next month 1st date
  const nextBd = new Date(bd.getFullYear(), bd.getMonth() + 1, 1, 0, 0, 0, 0);
  return new Date(nextBd.getTime() - (3600000 * BD_OFFSET_HOURS));
}
