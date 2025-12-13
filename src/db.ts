import { Env } from "./env";

export async function initDB(env: Env) {
  const q = [
    `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT, permissions TEXT DEFAULT '[]')`,
    `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY, name TEXT, phone TEXT, plan TEXT, joined_at TEXT, expiry_date TEXT, status TEXT DEFAULT 'active')`,
    `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, member_id INTEGER, check_in_time TEXT, status TEXT)`,
    `CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, member_id INTEGER, amount INTEGER, date TEXT)`,
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT)`
  ];
  for (const sql of q) await env.DB.prepare(sql).run();

  // --- MIGRATIONS: Ensure these columns exist for the new features ---
  try { await env.DB.prepare("ALTER TABLE members ADD COLUMN balance INTEGER DEFAULT 0").run(); } catch (e) {}
  try { await env.DB.prepare("ALTER TABLE members ADD COLUMN manual_due_months INTEGER DEFAULT 0").run(); } catch (e) {}
  
  // NEW: Physical Stats & Notes
  try { await env.DB.prepare("ALTER TABLE members ADD COLUMN gender TEXT DEFAULT 'other'").run(); } catch (e) {}
  try { await env.DB.prepare("ALTER TABLE members ADD COLUMN weight REAL DEFAULT 0").run(); } catch (e) {}
  try { await env.DB.prepare("ALTER TABLE members ADD COLUMN height REAL DEFAULT 0").run(); } catch (e) {}
  try { await env.DB.prepare("ALTER TABLE members ADD COLUMN notes TEXT").run(); } catch (e) {}

  try { await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, check_in_time)").run(); } catch (e) {}
  try { await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(check_in_time)").run(); } catch (e) {}
  try { await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone)").run(); } catch (e) {}
  try { await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id)").run(); } catch (e) {}
}

export async function factoryReset(env: Env) {
  const drops = ["config", "users", "members", "attendance", "payments", "sessions"];
  for (const table of drops) await env.DB.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  await initDB(env);
}
