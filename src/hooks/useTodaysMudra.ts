import { useMemo } from "react";

import { Mudra } from "@/types";
import { todayISODate } from "@/lib/utils";

import { useMudras } from "./useMudras";

/**
 * Deterministically rotates a "Today's Mudra" from the local library so it's
 * stable for the whole day and works fully offline.
 */
export function useTodaysMudra(): { data: Mudra | undefined; isLoading: boolean } {
  const { data: mudras = [], isLoading } = useMudras();

  const data = useMemo(() => {
    if (mudras.length === 0) return undefined;
    const iso = todayISODate(); // YYYY-MM-DD
    // Simple stable hash of the date -> index.
    let h = 0;
    for (let i = 0; i < iso.length; i++) h = (h * 31 + iso.charCodeAt(i)) >>> 0;
    return mudras[h % mudras.length];
  }, [mudras]);

  return { data, isLoading };
}
