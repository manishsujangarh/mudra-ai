import { UserPreferences, WellnessGoal } from "@/types";

import { getDatabase } from "../client";

interface PrefRow {
  preferred_time: string | null;
  wellness_goal: string | null;
  onboarding_completed: number;
}

export async function getPreferences(): Promise<UserPreferences> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PrefRow>(
    "SELECT preferred_time, wellness_goal, onboarding_completed FROM user_preferences WHERE id = 1;"
  );
  return {
    preferredTime: row?.preferred_time ?? null,
    wellnessGoal: (row?.wellness_goal as WellnessGoal | null) ?? null,
    onboardingCompleted: (row?.onboarding_completed ?? 0) === 1,
  };
}

export async function updatePreferences(
  patch: Partial<UserPreferences>
): Promise<UserPreferences> {
  const db = await getDatabase();
  const current = await getPreferences();
  const next: UserPreferences = { ...current, ...patch };
  await db.runAsync(
    `UPDATE user_preferences SET
       preferred_time = ?, wellness_goal = ?, onboarding_completed = ?
     WHERE id = 1;`,
    [
      next.preferredTime,
      next.wellnessGoal,
      next.onboardingCompleted ? 1 : 0,
    ]
  );
  return next;
}
