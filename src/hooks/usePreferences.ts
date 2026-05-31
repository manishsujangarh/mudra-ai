import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserPreferences } from "@/types";
import { getPreferences, updatePreferences } from "@/db/repositories/preferences";
import { queryKeys } from "@/lib/queryClient";
import { useAppStore } from "@/store/useAppStore";

export function usePreferences() {
  const dbReady = useAppStore((s) => s.dbReady);
  return useQuery({
    queryKey: queryKeys.preferences,
    queryFn: getPreferences,
    enabled: dbReady,
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<UserPreferences>) => updatePreferences(patch),
    onSuccess: (next) => {
      qc.setQueryData(queryKeys.preferences, next);
    },
  });
}
