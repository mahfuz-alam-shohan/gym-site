import { formatMonthKey, getBdDate, monthEnd, nextMonthStart } from "./time";

// --- HELPERS ---

// Converts list of ISO timestamps into a Set of "YYYY-MM" keys and their day counts
export function getAttendanceStats(attendanceTs: string[] | undefined): Record<string, number> {
  const stats: Record<string, Set<number>> = {};
  for (const ts of attendanceTs || []) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) continue;
    const key = formatMonthKey(d); // Uses BD time
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

// --- CORE LOGIC ---

export type DueResult = {
  count: number;          // Number of months strictly DUE (billable & unpaid)
  months: Date[];         // The specific months that are due
  labels: string[];       // Human readable labels (e.g., "Jan 2024")
  gapMonths: number;      // Number of months skipped because attendance < threshold
};

/**
 * Calculates exactly which months the user owes money for.
 * It skips months where attendance < threshold (The "Gap").
 */
export function calculateDues(
  expiryDateStr: string | null,
  attendanceTs: string[],
  threshold: number,
  manualDue: number,
  now: Date = new Date()
): DueResult {
  
  const dueMonths: Date[] = [];
  let gapMonths = 0;
  
  // 1. Handle Manual Dues (Migration or Penalty)
  // We just generate placeholder dates for them descending from current date
  if (manualDue > 0) {
    const anchor = getBdDate(now);
    for(let i=0; i<manualDue; i++) {
       dueMonths.push(new Date(anchor.getFullYear(), anchor.getMonth() - i - 1, 1));
    }
  }

  // 2. Scan from Expiry Date forward
  if (expiryDateStr) {
    const expiry = new Date(expiryDateStr);
    const attendanceStats = getAttendanceStats(attendanceTs);
    
    // Start checking from the MONTH AFTER expiry
    let cursor = nextMonthStart(expiry);
    const today = now; 

    // Safety break: don't loop more than 5 years
    let loopGuard = 0;
    
    // Loop while cursor is in the past or present month
    while (cursor <= today && loopGuard < 60) {
      loopGuard++;
      const key = formatMonthKey(cursor);
      const daysAttended = attendanceStats[key] || 0;

      if (daysAttended >= threshold) {
        // User attended enough. This month is BILLABLE.
        dueMonths.push(new Date(cursor));
      } else {
        // User did NOT attend enough. This is a GAP month.
        gapMonths++;
      }
      
      cursor = nextMonthStart(cursor);
    }
  }

  return {
    count: dueMonths.length,
    months: dueMonths,
    labels: dueMonths.map(d => formatMonthLabel(d)),
    gapMonths
  };
}

/**
 * Calculates the NEW expiry date after a payment.
 * CRITICAL: This implements the "School Fee" logic.
 * It pays off manual dues first, then billable months, then extends into future.
 * It automatically JUMPS over gap months (updates expiry to skip them) for free.
 */
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
  
  // How many full months can we pay for?
  let monthsToPay = planPrice > 0 ? Math.floor(balance / planPrice) : 0;
  
  // Remainder stays in wallet
  if (planPrice > 0) {
    balance = balance % planPrice;
  } else {
    // If plan is free (0), we usually treat any payment as significant or ignore it
    // Logic: if price is 0, they effectively have infinite months, but let's just guard
    if(amountPaid > 0) monthsToPay = 99; 
  }

  let expiry = new Date(currentExpiryStr);
  const attendanceStats = getAttendanceStats(attendanceTs);
  
  // 1. Pay off Manual Dues first (Old Debt)
  while (manualDue > 0 && monthsToPay > 0) {
    manualDue--;
    monthsToPay--;
  }

  // 2. Pay off Billable Months & Skip Gaps
  // We scan forward from current expiry
  
  let cursor = nextMonthStart(expiry);
  
  // We scan at least until TODAY to "Resolve" any gaps in the past
  // even if user has no money, we should theoretically advance over gaps.
  
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
           // PAYING for this month
           monthsToPay--;
           expiry = monthEnd(cursor); // Advance expiry to end of this billable month
         } else {
           // Owe money for this month, but no funds. Stop advancing.
           break; 
         }
       } else {
         // NOT BILLABLE (Gap).
         // We SKIP this month for free.
         expiry = monthEnd(cursor); // Advance expiry over the gap
       }
    } else {
       // FUTURE month.
       // Only advance if we have credits (Advance Payment)
       if (monthsToPay > 0) {
         monthsToPay--;
         expiry = monthEnd(cursor);
       } else {
         break; // No more money, stop.
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
