import { Env } from "./types";

export class DB {
  constructor(private db: D1Database) {}

  async first<T = any>(query: string, ...args: any[]): Promise<T | null> {
    return await this.db.prepare(query).bind(...args).first<T>();
  }

  async all<T = any>(query: string, ...args: any[]): Promise<T[]> {
    const res = await this.db.prepare(query).bind(...args).all<T>();
    return res.results || [];
  }

  async run(query: string, ...args: any[]): Promise<void> {
    await this.db.prepare(query).bind(...args).run();
  }

  static async init(env: Env) {
    const q = [
      `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`,
      `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT, permissions TEXT DEFAULT '[]')`,
      `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY, name TEXT, phone TEXT, plan TEXT, joined_at TEXT, expiry_date TEXT, status TEXT DEFAULT 'active', balance INTEGER DEFAULT 0, manual_due_months INTEGER DEFAULT 0)`,
      `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, member_id INTEGER, check_in_time TEXT, status TEXT)`,
      `CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, member_id INTEGER, amount INTEGER, date TEXT)`,
      `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT)`
    ];
    for (const sql of q) await env.DB.prepare(sql).run();
    
    // Indexes
    const idx = [
      `CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, check_in_time)`,
      `CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(check_in_time)`,
      `CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone)`,
      `CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id)`
    ];
    for (const sql of idx) await env.DB.prepare(sql).run();
  }

  static async nuke(env: Env) {
    const drops = ["config", "users", "members", "attendance", "payments", "sessions"];
    for (const table of drops) await env.DB.prepare(`DROP TABLE IF EXISTS ${table}`).run();
    await this.init(env);
  }
}
