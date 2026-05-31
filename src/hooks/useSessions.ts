import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completeSession,
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
    mutationFn: (routineId: string) => completeSession(routineId),
    onSuccess: (_data, routineId) => {
      qc.invalidateQueries({ queryKey: queryKeys.routines });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
      qc.invalidateQueries({ queryKey: ["completedToday", routineId] });
    },
  });
}
