import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRoutine,
  deactivateRoutine,
  getActiveRoutines,
  getRoutineById,
  setRoutineNotification,
} from "@/db/repositories/routines";
import {
  cancelReminder,
  scheduleDailyReminder,
} from "@/notifications";
import { queryKeys } from "@/lib/queryClient";
import { useAppStore } from "@/store/useAppStore";

export function useActiveRoutines() {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: queryKeys.routines,
    queryFn: getActiveRoutines,
    enabled: dbReady,
  });
}

export function useRoutine(id: string | undefined) {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: queryKeys.routine(id ?? ""),
    queryFn: () => getRoutineById(id!),
    enabled: dbReady && !!id,
  });
}

/** Create a routine AND schedule its daily reminder in one step. */
export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      mudraId: string;
      mudraName: string;
      reminderTime: string;
      duration: number;
    }) => {
      const routine = await createRoutine({
        mudraId: input.mudraId,
        reminderTime: input.reminderTime,
        duration: input.duration,
      });

      const notificationId = await scheduleDailyReminder({
        mudraName: input.mudraName,
        time: input.reminderTime,
        routineId: routine.id,
      });

      if (notificationId) {
        await setRoutineNotification(routine.id, notificationId);
        routine.notificationId = notificationId;
      }
      return routine;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (routine: { id: string; notificationId: string | null }) => {
      if (routine.notificationId) await cancelReminder(routine.notificationId);
      await deactivateRoutine(routine.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
}
