import { Env } from "./env";
import { DEFAULT_TIMEZONE, zonedNow, formatDateOnly } from "./time";

export async function loadSettings(env: Env): Promise<{
  configMap: Record<string, string>;
  attendanceThreshold: number;
  inactiveAfterMonths: number;
  renewalFee: number;
  currency: string;
  lang: string;
  membershipPlans: any[];
  clock: any;
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

  const clock = {
    timezone,
    simulated,
    simulatedTime: simulated ? clockNow.toISOString() : null,
    now: clockNow,
    today: formatDateOnly(clockNow),
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
