import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client. Tuned for an offline-first SQLite app: data
 * rarely changes underneath us, so we keep it fresh for a while and don't
 * refetch aggressively.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Centralized query keys to keep invalidation consistent. */
export const queryKeys = {
  mudras: ["mudras"] as const,
  mudra: (idOrSlug: string) => ["mudra", idOrSlug] as const,
  categories: ["categories"] as const,
  routines: ["routines"] as const,
  routine: (id: string) => ["routine", id] as const,
  preferences: ["preferences"] as const,
  stats: ["stats"] as const,
};
