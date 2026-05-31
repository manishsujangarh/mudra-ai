import { useEffect, useState } from "react";

import { getDatabase } from "@/db/client";
import { ensureSeeded, syncRemote } from "@/lib/sync";
import { useAppStore } from "@/store/useAppStore";

/**
 * App startup flow (per spec):
 *  1. Open/initialize SQLite.
 *  2. If empty -> seed from bundled JSON.
 *  3. If present -> load existing data.
 *  4. Kick off a (throttled, best-effort) remote sync in the background.
 *
 * Returns a readiness flag the root layout uses to gate the UI.
 */
export function useBootstrap() {
  const setDbReady = useAppStore((s) => s.setDbReady);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await getDatabase(); // step 1 + migrations
        await ensureSeeded(); // step 2/3

        if (cancelled) return;
        setDbReady(true);
        setReady(true);

        // step 4: background sync — never blocks the UI, fails silently offline.
        syncRemote(false).catch(() => {});
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to initialize");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setDbReady]);

  return { ready, error };
}
