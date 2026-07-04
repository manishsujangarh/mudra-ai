/**
 * Canonical SQLite schema for Mudra AI.
 *
 * Tables follow the product spec:
 *   mudras, routines, sessions, user_preferences
 *
 * `user_preferences` is a single-row table (enforced via a fixed primary key).
 */

export const SCHEMA_VERSION = 3;

export const CREATE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS mudras (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    benefits TEXT NOT NULL DEFAULT '[]',
    instructions TEXT NOT NULL DEFAULT '[]',
    duration INTEGER NOT NULL DEFAULT 10,
    category TEXT NOT NULL DEFAULT 'general',
    image_url TEXT,
    source_url TEXT,
    updated_at INTEGER NOT NULL DEFAULT 0
  );`,

  `CREATE INDEX IF NOT EXISTS idx_mudras_category ON mudras(category);`,

  `CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY NOT NULL,
    mudra_id TEXT NOT NULL,
    reminder_time TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 10,
    start_date TEXT NOT NULL,
    streak INTEGER NOT NULL DEFAULT 0,
    notification_id TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (mudra_id) REFERENCES mudras(id) ON DELETE CASCADE
  );`,

  `CREATE INDEX IF NOT EXISTS idx_routines_active ON routines(active);`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    routine_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    pre_mood TEXT,
    post_mood TEXT,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
  );`,

  `CREATE INDEX IF NOT EXISTS idx_sessions_routine ON sessions(routine_id);`,

  `CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    preferred_time TEXT,
    wellness_goal TEXT,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    ads_removed INTEGER NOT NULL DEFAULT 0
  );`,

  // Ensure the single preferences row always exists.
  `INSERT OR IGNORE INTO user_preferences (id, onboarding_completed) VALUES (1, 0);`,

  // Key/value table for sync bookkeeping (last sync timestamp, source hash, etc).
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT
  );`,
];
