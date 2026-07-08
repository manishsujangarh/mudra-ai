import { create } from "zustand";

import { Recommendation } from "@/types";

/**
 * Plan structure for multi-plan support.
 */
export interface PlanData {
  id: string;
  titleKey: string;
  totalDays: number;
  currentDay: number;
  icon: string;
  color: string;
  mudrasPerDay: string[]; // Arrays of mudra IDs corresponding to each day
}

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

  // 🔥 MULTI-PLAN TRACKING STATE
  activePlans: PlanData[];
  togglePlanActivation: (plan: PlanData) => void;
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

  // 🔥 Multi-Plan Default State (Day 2 for sleep plan as requested before)
  activePlans: [
    {
      id: "sleep_7_days",
      titleKey: "7 Days to Better Sleep",
      totalDays: 7,
      currentDay: 2,
      icon: "moon-waning-crescent",
      color: "#6366F1",
      mudrasPerDay: ["gyan", "prana", "shuni", "apana", "vayan", "surya", "linga"],
    },
  ],

  // Toggles activation state: removes if exists, adds if new
  togglePlanActivation: (plan) =>
    set((state) => {
      const exists = state.activePlans.some((p) => p.id === plan.id);
      if (exists) {
        return { activePlans: state.activePlans.filter((p) => p.id !== plan.id) };
      } else {
        return { activePlans: [...state.activePlans, plan] };
      }
    }),
}));