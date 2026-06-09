import * as Network from "expo-network";

import { countMudras, upsertMudras } from "@/db/repositories/mudras";
import { META_KEYS, getMeta, setMeta } from "@/db/repositories/meta";
import {
  getSeedMudras,
  hashMudras,
  normalizeMudraList,
} from "@/data/import";

const REMOTE_SOURCE =
  process.env.EXPO_PUBLIC_MUDRA_SOURCE_URL ?? "";

/** How often we attempt a background refresh (ms). */
export const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface SyncResult {
  seeded: boolean;
  inserted: number;
  updated: number;
  source: "seed" | "remote" | "skipped";
}

/**
 * App startup data flow:
 *  1. If the DB is empty, seed it from the bundled JSON (guarantees offline use).
 *  2. Otherwise leave existing data in place.
 *
 * This never touches the network — it's safe to await before first render.
 */
export async function ensureSeeded(): Promise<SyncResult> {
  const existing = await countMudras();
  const mudras = getSeedMudras();
  const hash = hashMudras(mudras);

  if (existing > 0) {
    const prevHash = await getMeta(META_KEYS.sourceHash);
    if (prevHash !== hash) {
      const { inserted, updated } = await upsertMudras(mudras);
      await setMeta(META_KEYS.sourceHash, hash);
      await setMeta(META_KEYS.lastSyncAt, String(Date.now()));
      return { seeded: false, inserted, updated, source: "seed" };
    }

    return { seeded: false, inserted: 0, updated: 0, source: "skipped" };
  }

  const { inserted, updated } = await upsertMudras(mudras);
  await setMeta(META_KEYS.sourceHash, hash);
  await setMeta(META_KEYS.lastSyncAt, String(Date.now()));
  return { seeded: true, inserted, updated, source: "seed" };
}

/**
 * Periodic sync. Pulls a remote JSON dataset when online and upserts any
 * changes. Falls back silently to the local data on any failure — the app is
 * fully usable offline regardless.
 */
export async function syncRemote(force = false): Promise<SyncResult> {
  // Throttle unless forced.
  if (!force) {
    const last = Number((await getMeta(META_KEYS.lastSyncAt)) ?? 0);
    if (Date.now() - last < SYNC_INTERVAL_MS) {
      return { seeded: false, inserted: 0, updated: 0, source: "skipped" };
    }
  }

  // Only attempt when we have connectivity and a configured source.
  if (!REMOTE_SOURCE) {
    return { seeded: false, inserted: 0, updated: 0, source: "skipped" };
  }
  try {
    const net = await Network.getNetworkStateAsync();
    if (!net.isConnected || !net.isInternetReachable) {
      return { seeded: false, inserted: 0, updated: 0, source: "skipped" };
    }
  } catch {
    return { seeded: false, inserted: 0, updated: 0, source: "skipped" };
  }

  try {
    const res = await fetch(REMOTE_SOURCE, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    // Accept either a bare array or { mudras: [...] }.
    const list = Array.isArray(json) ? json : json?.mudras;
    const mudras = normalizeMudraList(list);
    if (mudras.length === 0) {
      return { seeded: false, inserted: 0, updated: 0, source: "skipped" };
    }

    const hash = hashMudras(mudras);
    const prevHash = await getMeta(META_KEYS.sourceHash);
    await setMeta(META_KEYS.lastSyncAt, String(Date.now()));

    if (hash === prevHash) {
      return { seeded: false, inserted: 0, updated: 0, source: "skipped" };
    }

    const { inserted, updated } = await upsertMudras(mudras);
    await setMeta(META_KEYS.sourceHash, hash);
    return { seeded: false, inserted, updated, source: "remote" };
  } catch {
    // Network/parse failure — stay offline-first, no throw.
    return { seeded: false, inserted: 0, updated: 0, source: "skipped" };
  }
}

export async function getLastSyncAt(): Promise<number | null> {
  const v = await getMeta(META_KEYS.lastSyncAt);
  return v ? Number(v) : null;
}
