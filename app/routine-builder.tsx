import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { TimePicker } from "@/components/TimePicker";
import { Button, EmptyState, Screen, SectionTitle } from "@/components/ui";
import { useCreateRoutine } from "@/hooks/useRoutines";
import { usePreferences } from "@/hooks/usePreferences";
import { clamp } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

/**
 * Routine builder (modal). Uses the pending recommendation (from chat or a
 * mudra detail screen), asks "what time do you want to practice?", and creates
 * a daily routine + reminder in SQLite.
 */
export default function RoutineBuilder() {
  const router = useRouter();
  const rec = useAppStore((s) => s.pendingRecommendation);
  const setPendingRecommendation = useAppStore(
    (s) => s.setPendingRecommendation
  );
  const { data: prefs } = usePreferences();
  const create = useCreateRoutine();

  const [time, setTime] = useState(prefs?.preferredTime ?? "07:30");
  const [duration, setDuration] = useState(2);

  if (!rec) {
    return (
      <Screen>
        <EmptyState
          title="Nothing to schedule"
          subtitle="Pick a mudra or ask the AI Guide first."
        />
      </Screen>
    );
  }

  const onCreate = async () => {
    await create.mutateAsync({
      mudraId: rec.mudra.id,
      mudraName: rec.mudra.name,
      reminderTime: time,
      duration: clamp(duration, 1, 60),
    });
    setPendingRecommendation(null);
    router.replace("/(tabs)/routines");
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text className="text-sm text-muted">Building a routine for</Text>
        <Text className="text-2xl font-bold text-ink">{rec.mudra.name}</Text>
        {rec.reason ? (
          <Text className="mt-2 text-sm text-muted">{rec.reason}</Text>
        ) : null}

        <View className="mt-8">
          <SectionTitle>What time do you want to practice?</SectionTitle>
          <TimePicker value={time} onChange={setTime} />
        </View>

        <View className="mt-8">
          <SectionTitle>Session length</SectionTitle>
          <View className="flex-row items-center rounded-2xl bg-surface p-4">
            <Button
              label="−"
              variant="secondary"
              onPress={() => setDuration((d) => clamp(d - 1, 1, 60))}
            />
            <Text className="flex-1 text-center text-2xl font-bold text-ink">
              {duration} min
            </Text>
            <Button
              label="+"
              variant="secondary"
              onPress={() => setDuration((d) => clamp(d + 1, 1, 60))}
            />
          </View>
        </View>

        <View className="mt-10">
          <Button
            label="Create daily routine"
            onPress={onCreate}
            loading={create.isPending}
          />
          <Text className="mt-3 text-center text-xs text-muted">
            We'll remind you every day at this time.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
