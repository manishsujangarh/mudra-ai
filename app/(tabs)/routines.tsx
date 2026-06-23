import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";

import { StreakBadge } from "@/components/StreakBadge";
import { Button, EmptyState, Screen } from "@/components/ui";
import { useActiveRoutines, useDeleteRoutine } from "@/hooks/useRoutines";
import { formatTime } from "@/lib/utils";
import { AdBanner } from "@/ads/AdBanner";

export default function Routines() {
  const router = useRouter();
  const { data: routines = [], isLoading } = useActiveRoutines();
  const del = useDeleteRoutine();

  return (
    <Screen>
      <View className="px-5 pt-3">
        <Text className="text-2xl font-bold text-ink">Your Routines</Text>
        <Text className="text-xs text-muted">
          Daily reminders keep your practice consistent.
        </Text>
      </View>

      <FlatList
        data={routines}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-3xl bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-lg font-semibold text-ink">
                {item.mudra.name}
              </Text>
              <StreakBadge streak={item.streak} />
            </View>
            <Text className="mt-1 text-sm text-muted">
              Daily at {formatTime(item.reminderTime)} · {item.duration} min
            </Text>

            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Practice"
                  onPress={() => router.push(`/practice/${item.id}`)}
                />
              </View>
              <Pressable
                onPress={() =>
                  del.mutate({
                    id: item.id,
                    notificationId: item.notificationId,
                  })
                }
                className="items-center justify-center rounded-2xl border border-brand-light/40 bg-surface px-5 active:opacity-70"
              >
                <Text className="font-semibold text-muted">Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="No routines yet"
              subtitle="Ask the AI Guide for a recommendation and build your first daily routine."
            />
          )
        }
      />

      <AdBanner />

    </Screen>
  );
}
