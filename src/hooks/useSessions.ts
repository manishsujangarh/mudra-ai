import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completeSession,
  getMoodInsights,
  getTotalCompletedSessions,
  hasCompletedToday,
} from "@/db/repositories/sessions";
import { queryKeys } from "@/lib/queryClient";
import { useAppStore } from "@/store/useAppStore";

export function useStats() {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: getTotalCompletedSessions,
    enabled: dbReady,
  });
}

export function useCompletedToday(routineId: string | undefined) {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: ["completedToday", routineId],
    queryFn: () => hasCompletedToday(routineId!),
    enabled: dbReady && !!routineId,
  });
}

/** Complete a practice session; recomputes streak and refreshes related views. */
export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { routineId: string; preMood?: string | null; postMood?: string | null }) =>
      completeSession(data.routineId, data.preMood, data.postMood),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.routines });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
      qc.invalidateQueries({ queryKey: ["completedToday", variables.routineId] });
    },
  });
}

export function useMoodInsights() {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: ["moodInsights"],
    queryFn: getMoodInsights,
    enabled: dbReady,
  });
}