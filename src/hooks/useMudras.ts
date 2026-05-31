import { useQuery } from "@tanstack/react-query";

import {
  filterMudras,
  getAllMudras,
  getCategories,
  getMudraById,
  getMudraBySlug,
} from "@/db/repositories/mudras";
import { queryKeys } from "@/lib/queryClient";
import { useAppStore } from "@/store/useAppStore";

export function useMudras() {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: queryKeys.mudras,
    queryFn: getAllMudras,
    enabled: dbReady,
  });
}

export function useCategories() {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    enabled: dbReady,
  });
}

export function useMudraBySlug(slug: string | undefined) {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: queryKeys.mudra(slug ?? ""),
    queryFn: () => getMudraBySlug(slug!),
    enabled: dbReady && !!slug,
  });
}

export function useMudraById(id: string | undefined) {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: queryKeys.mudra(id ?? ""),
    queryFn: () => getMudraById(id!),
    enabled: dbReady && !!id,
  });
}

/**
 * Filtered + searched list for the Search screen. Reads filter state from the
 * Zustand store so the query key (and refetch) tracks the active filters.
 */
export function useFilteredMudras() {
  const dbReady = useAppStore((s) => s.dbReady);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const category = useAppStore((s) => s.selectedCategory);
  const benefit = useAppStore((s) => s.selectedBenefit);

  return useQuery({
    queryKey: ["mudras", "filtered", searchQuery, category, benefit],
    enabled: dbReady,
    queryFn: async () => {
      // Apply DB-level filters first, then client-side search narrowing.
      const base = await filterMudras({
        category: category ?? undefined,
        benefit: benefit ?? undefined,
      });
      const q = searchQuery.trim().toLowerCase();
      if (!q) return base;
      return base.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.benefits.some((b) => b.toLowerCase().includes(q))
      );
    },
  });
}
