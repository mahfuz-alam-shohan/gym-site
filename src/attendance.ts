import { formatMonthKey, getBdDate, monthEnd, nextMonthStart } from "./time";

// --- HELPERS ---

export function getAttendanceStats(attendanceTs: string[] | undefined): Record<string, number> {
  const stats: Record<string, Set<number>> = {};
  for (const ts of attendanceTs || []) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) continue;
    const key = formatMonthKey(d); 
    if (!stats[key]) stats[key] = new Set();
    stats[key].add(getBdDate(d).getDate());
  }
  
  const counts: Record<string, number> = {};
  for(const k in stats) counts[k] = stats[k].size;
  return counts;
}

export function formatMonthLabel(date: Date): string {
  const bd = getBdDate(date);
  const monthName = bd.toLocaleString("en-US", { month: "short" });
  return `${monthName} ${bd.getFullYear()}`;
}

// NEW: Calculate Gym Streak (Consecutive days visited)
export function getStreak(attendanceTs: string[]): number {
    if (!attendanceTs || attendanceTs.length === 0) return 0;
    // Sort descending by day
    const sorted = attendanceTs.map(t => new Date(t).toISOString().split('T')[0]).sort().reverse();
    const uniqueDays = [...new Set(sorted)];
    
    if (uniqueDays.length === 0) return 0;

    // Check if today or yesterday was attended to keep streak alive
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
        const curr = new Date(uniqueDays[i]);
        const prev = new Date(uniqueDays[i+1]);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) streak++;
        else break;
    }
    return streak;
}

// --- CORE LOGIC ---

export type DueResult = {
  count: number;
  months: Date[];
  labels: string[];
  gapMonths: number;
  isRunningMonthPaid: boolean; // NEW: Explicitly tells if current month is paid
  paidUntil: string | null;
};

export function calculateDues(
  expiryDateStr: string | null,
  attendanceTs: string[],
  threshold: number,
  manualDue: number,
  now: Date = new Date()
): DueResult {
  
  const dueMonths: Date[] = [];
  let gapMonths = 0;
  
  // 1. Manual Dues
  if (manualDue > 0) {
    const anchor = getBdDate(now);
    for(let i=0; i<manualDue; i++) {
       dueMonths.push(new Date(anchor.getFullYear(), anchor.getMonth() - i - 1, 1));
    }
  }

  // 2. Scan from Expiry Date forward
  let isRunningMonthPaid = false;
  
  if (expiryDateStr) {
    const expiry = new Date(expiryDateStr);
    
    // Check coverage: If expiry date is in the future compared to NOW, the "running time" is paid.
    if (expiry >= now) {
        isRunningMonthPaid = true;
    }

    const attendanceStats = getAttendanceStats(attendanceTs);
    let cursor = nextMonthStart(expiry);
    const today = now; 
    let loopGuard = 0;
    
    while (cursor <= today && loopGuard < 60) {
      loopGuard++;
      const key = formatMonthKey(cursor);
      const daysAttended = attendanceStats[key] || 0;

      if (daysAttended >= threshold) {
        dueMonths.push(new Date(cursor));
      } else {
        gapMonths++;
      }
      cursor = nextMonthStart(cursor);
    }
  }

  return {
    count: dueMonths.length,
    months: dueMonths,
    labels: dueMonths.map(d => formatMonthLabel(d)),
    gapMonths,
    isRunningMonthPaid,
    paidUntil: expiryDateStr
  };
}

export function processPayment(
  currentExpiryStr: string,
  attendanceTs: string[],
  amountPaid: number,
  planPrice: number,
  currentBalance: number,
  currentManualDue: number,
  threshold: number,
  now: Date
) {
  let balance = currentBalance + amountPaid;
  let manualDue = currentManualDue;
  let monthsToPay = planPrice > 0 ? Math.floor(balance / planPrice) : 0;
  
  if (planPrice > 0) balance = balance % planPrice;
  else if(amountPaid > 0) monthsToPay = 99; // Free plan logic

  let expiry = new Date(currentExpiryStr);
  const attendanceStats = getAttendanceStats(attendanceTs);
  
  // 1. Pay Old Debt
  while (manualDue > 0 && monthsToPay > 0) {
    manualDue--;
    monthsToPay--;
  }

  // 2. Pay Billable & Skip Gaps
  let cursor = nextMonthStart(expiry);
  let loop = 0;
  
  while (loop < 60) {
    loop++;
    const isPastOrPresent = cursor <= now;
    
    if (isPastOrPresent) {
       const key = formatMonthKey(cursor);
       const daysAttended = attendanceStats[key] || 0;
       const isBillable = daysAttended >= threshold;

       if (isBillable) {
         if (monthsToPay > 0) {
           monthsToPay--;
           expiry = monthEnd(cursor);
         } else {
           break; 
         }
       } else {
         expiry = monthEnd(cursor); // Skip gap
       }
    } else {
       if (monthsToPay > 0) {
         monthsToPay--;
         expiry = monthEnd(cursor);
       } else {
         break;
       }
    }
    cursor = nextMonthStart(cursor);
  }

  return {
    newExpiry: expiry.toISOString(),
    newBalance: balance,
    newManualDue: manualDue
  };
}
