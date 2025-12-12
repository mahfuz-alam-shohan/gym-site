import { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

export type Role = 'admin' | 'staff' | 'viewer';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  permissions: string[]; // JSON string in DB, parsed array in app
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  plan: string;
  joined_at: string;
  expiry_date: string;
  status: 'active' | 'due' | 'inactive';
  balance: number;
  manual_due_months: number;
}

export interface SystemClock {
  timezone: string;
  simulated: boolean;
  simulatedTime: string | null;
  now: Date;
  today: string;
}

export interface GymSettings {
  configMap: Record<string, string>;
  attendanceThreshold: number;
  inactiveAfterMonths: number;
  renewalFee: number;
  currency: string;
  lang: string;
  membershipPlans: Plan[];
  clock: SystemClock;
}

export interface Plan {
  name: string;
  price: number;
  admissionFee: number;
}

export interface Context {
  req: Request;
  env: Env;
  url: URL;
  user?: User | null;
  params?: Record<string, string>;
}

export type Handler = (ctx: Context) => Promise<Response>;
