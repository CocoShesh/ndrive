import './env.mjs';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(process.env.NDRIVE_DB_FILE || `${here}/data/ndrive.sqlite`);
mkdirSync(dirname(dbPath), { recursive: true, mode: 0o700 });
try { chmodSync(dirname(dbPath), 0o700); } catch {}
export const db = new DatabaseSync(dbPath);
try { chmodSync(dbPath, 0o600); } catch {}
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL, password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', google_subject TEXT, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, provider_account_id TEXT, email TEXT, label TEXT NOT NULL,
    encrypted_refresh_token TEXT, root_id TEXT,
    quota_limit INTEGER, quota_usage INTEGER, quota_checked_at INTEGER,
    priority INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS connections_owner ON connections(user_id, provider);
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    upload_policy TEXT NOT NULL DEFAULT 'most-available', round_robin_cursor INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, key_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL,
    last_used_at INTEGER, revoked_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS remote_items (
    id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    parent_id TEXT, name TEXT NOT NULL, mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0, modified_at TEXT,
    PRIMARY KEY(connection_id, id)
  );
  CREATE INDEX IF NOT EXISTS remote_items_folder ON remote_items(connection_id, parent_id);
  CREATE TABLE IF NOT EXISTS upload_jobs (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, size_bytes INTEGER NOT NULL, provider TEXT,
    connection_id TEXT, status TEXT NOT NULL, created_at INTEGER NOT NULL, finished_at INTEGER
  );
`);
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS google_connection_single_owner ON connections(lower(email)) WHERE provider='google' AND email IS NOT NULL AND enabled=1");
} catch {
  // Keep existing data intact; the OAuth connect flow still checks ownership transactionally.
  console.warn('[ndrive] Existing duplicate Google Drive connections prevent the unique ownership index from being created.');
}
try { db.exec('ALTER TABLE users ADD COLUMN google_subject TEXT'); } catch {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS user_google_subject ON users(google_subject) WHERE google_subject IS NOT NULL'); } catch {}
try { db.exec('ALTER TABLE connections ADD COLUMN provider_account_id TEXT'); } catch {}
try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS google_connection_identity_owner ON connections(provider_account_id) WHERE provider='google' AND provider_account_id IS NOT NULL AND enabled=1"); } catch {
  console.warn('[ndrive] Existing duplicate Google Drive identities prevent the unique ownership index from being created.');
}
try { db.exec("ALTER TABLE user_settings ADD COLUMN priority_json TEXT NOT NULL DEFAULT '[]'"); } catch {}

export const now = () => Date.now();
export const newId = () => randomBytes(16).toString('hex');
export const hashToken = token => createHash('sha256').update(token).digest('hex');

export function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [kind, saltHex, hashHex] = stored.split('$');
    if (kind !== 'scrypt') return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export function publicUser(row) {
  return row && { id: row.id, email: row.email, name: row.display_name, role: row.role };
}
