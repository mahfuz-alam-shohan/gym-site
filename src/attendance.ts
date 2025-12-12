import { DEFAULT_TIMEZONE, monthEnd, nextMonthStart, zonedNow } from "./time";

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

export function formatMonthLabel(date: Date, today: Date = zonedNow(DEFAULT_TIMEZONE)): string {
  const monthName = date.toLocaleString("en-US", { month: "short" });
  const currentYear = today.getFullYear();
  return date.getFullYear() === currentYear ? monthName : `${monthName} ${date.getFullYear()}`;
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
