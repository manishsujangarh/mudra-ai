import { getDatabase } from "../client";

/** Tiny key/value store backed by the `meta` table. */

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>(
    "SELECT value FROM meta WHERE key = ?;",
    [key]
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;",
    [key, value]
  );
}

export const META_KEYS = {
  lastSyncAt: "last_sync_at",
  sourceHash: "source_hash",
} as const;
