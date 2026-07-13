import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const dbReady = useAppStore((s) => s.dbReady);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const category = useAppStore((s) => s.selectedCategory);
  const benefit = useAppStore((s) => s.selectedBenefit);

  return useQuery({
    queryKey: ["mudras", "filtered", searchQuery, category, benefit, i18n.language],
    enabled: dbReady,
    queryFn: async () => {
      let base = await filterMudras({
        category: category ?? undefined,
      });

      if (benefit) {
        const bQuery = benefit.toLowerCase();
        base = base.filter((m) => {
          const translatedBenefits = m.benefits.map((bKey) => t(bKey)).join(" ").toLowerCase();
          return translatedBenefits.includes(bQuery);
        });
      }

      const q = searchQuery.trim().toLowerCase();
      if (q) {
        base = base.filter((m) => {
          const tName = t(m.name).toLowerCase();
          const tDesc = t(m.description).toLowerCase();
          const tBenefits = m.benefits.map((bKey) => t(bKey)).join(" ").toLowerCase();

          return (
            tName.includes(q) ||
            tDesc.includes(q) ||
            tBenefits.includes(q)
          );
        });
      }

      return base;
    },
  });
}