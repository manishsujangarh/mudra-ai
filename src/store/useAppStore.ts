import { create } from "zustand";

import { Recommendation } from "@/types";

/**
 * Lightweight global UI/session state (Zustand).
 * Persistent domain data lives in SQLite + React Query — this store only holds
 * ephemeral cross-screen state (e.g. handing a recommendation to the routine
 * builder, DB readiness flag, search filters).
 */

interface AppState {
  dbReady: boolean;
  setDbReady: (ready: boolean) => void;

  /** Recommendation passed from chat -> routine builder. */
  pendingRecommendation: Recommendation | null;
  setPendingRecommendation: (rec: Recommendation | null) => void;

  /** Search screen filters. */
  searchQuery: string;
  selectedCategory: string | null;
  selectedBenefit: string | null;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string | null) => void;
  setSelectedBenefit: (b: string | null) => void;
  resetFilters: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  dbReady: false,
  setDbReady: (dbReady) => set({ dbReady }),

  pendingRecommendation: null,
  setPendingRecommendation: (pendingRecommendation) =>
    set({ pendingRecommendation }),

  searchQuery: "",
  selectedCategory: null,
  selectedBenefit: null,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedBenefit: (selectedBenefit) => set({ selectedBenefit }),
  resetFilters: () =>
    set({ searchQuery: "", selectedCategory: null, selectedBenefit: null }),
}));
