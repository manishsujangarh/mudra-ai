import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { StreakBadge } from "@/components/StreakBadge";
import { Button, EmptyState, SectionTitle } from "@/components/ui";
import { Screen } from "@/components/ui";
import { useActiveRoutines } from "@/hooks/useRoutines";
import { useStats } from "@/hooks/useSessions";
import { useTodaysMudra } from "@/hooks/useTodaysMudra";
import { formatTime } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const { data: todaysMudra } = useTodaysMudra();
  const { data: routines = [] } = useActiveRoutines();
  const { data: totalSessions = 0 } = useStats();

  const activeRoutine = routines[0];
  const topStreak = routines.reduce((max, r) => Math.max(max, r.streak), 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-muted">Namaste 🙏</Text>
            <Text className="text-2xl font-bold text-ink">Your practice</Text>
          </View>
          <StreakBadge streak={topStreak} />
        </View>

        {/* Today's Mudra */}
        <View className="mt-6">
          <SectionTitle>Today's Mudra</SectionTitle>
          {todaysMudra ? (
            <Pressable
              onPress={() => router.push(`/mudra/${todaysMudra.slug}`)}
              className="overflow-hidden rounded-3xl bg-brand active:opacity-90"
            >
              <Image
                source={todaysMudra.imageUrl ?? undefined}
                contentFit="cover"
                style={{ height: 160, width: "100%" }}
                className="bg-brand-light/30"
              />
              <View className="p-5">
                <Text className="text-xl font-bold text-white">
                  {todaysMudra.name}
                </Text>
                <Text className="mt-1 text-sm text-white/80" numberOfLines={2}>
                  {todaysMudra.description}
                </Text>
                <Text className="mt-2 text-xs font-medium text-white/90">
                  Suggested · {todaysMudra.duration} min
                </Text>
              </View>
            </Pressable>
          ) : (
            <EmptyState title="No mudras yet" subtitle="Content is syncing…" />
          )}
        </View>

        {/* Active Routine */}
        <View className="mt-6">
          <SectionTitle>Active Routine</SectionTitle>
          {activeRoutine ? (
            <View className="rounded-3xl bg-white p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-ink">
                  {activeRoutine.mudra.name}
                </Text>
                <StreakBadge streak={activeRoutine.streak} />
              </View>
              <Text className="mt-1 text-sm text-muted">
                Daily at {formatTime(activeRoutine.reminderTime)} ·{" "}
                {activeRoutine.duration} min
              </Text>
              <View className="mt-4">
                <Button
                  label="Start Practice"
                  onPress={() => router.push(`/practice/${activeRoutine.id}`)}
                />
              </View>
            </View>
          ) : (
            <View className="rounded-3xl bg-white p-5">
              <Text className="text-sm text-muted">
                No routine yet. Ask the AI Guide for a recommendation, then
                build a daily routine.
              </Text>
              <View className="mt-4">
                <Button
                  label="Ask AI Guide"
                  variant="secondary"
                  onPress={() => router.push("/(tabs)/chat")}
                />
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="mt-6 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-white p-5">
            <Text className="text-3xl font-bold text-brand">{topStreak}</Text>
            <Text className="text-xs text-muted">Best streak</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-white p-5">
            <Text className="text-3xl font-bold text-brand">
              {totalSessions}
            </Text>
            <Text className="text-xs text-muted">Sessions done</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
