import { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

export type SystemClock = {
  timezone: string;
  simulated: boolean;
  simulatedTime: string | null;
  now: Date;
  today: string;
};
