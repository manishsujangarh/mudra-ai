import * as SQLite from "expo-sqlite";

import { CREATE_STATEMENTS, SCHEMA_VERSION } from "./schema";

const DB_NAME = "mudra-ai.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens (once) and returns the shared SQLite connection, running schema
 * creation and lightweight migrations on first open. Safe to call from many
 * places concurrently — initialization is memoized.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Pragmas: WAL for concurrency, enforce FKs for cascade deletes.
    await db.execAsync("PRAGMA journal_mode = WAL;");
    await db.execAsync("PRAGMA foreign_keys = ON;");

    await runMigrations(db);

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const { user_version: current } = (await db.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version;")) ?? { user_version: 0 };

  // Always (idempotently) ensure base tables exist.
  await db.withTransactionAsync(async () => {
    for (const stmt of CREATE_STATEMENTS) {
      await db.execAsync(stmt);
    }
  });

  if (current < 2) {
    await db.execAsync(
      "ALTER TABLE user_preferences ADD COLUMN ads_removed INTEGER NOT NULL DEFAULT 0;"
    );
  }

  if (current !== SCHEMA_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }
}

/** Reset helper for tests / "clear data". Drops the connection. */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
  }
}
