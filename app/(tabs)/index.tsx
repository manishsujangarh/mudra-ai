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
import { getMudraImage } from "@/utils/images";
import { AdBanner } from "@/ads/AdBanner";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: todaysMudra } = useTodaysMudra();
  const { data: routines = [] } = useActiveRoutines();
  const { data: totalSessions = 0 } = useStats();

  const activeRoutine = routines[0];
  const topStreak = routines.reduce((max, r) => Math.max(max, r.streak), 0);

  const imageSource = getMudraImage(todaysMudra?.imageUrl);


  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        <View className="mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-muted">{t("namaste")} 🙏</Text>
            <Text className="text-2xl font-bold text-ink">{t("your_practice")}</Text>
          </View>
          <StreakBadge streak={topStreak} />
        </View>

        {/* Today's Mudra */}
        <View className="mt-6">
          <SectionTitle>{t("today_mudra")}</SectionTitle>
          {todaysMudra ? (
            <Pressable
              onPress={() => router.push(`/mudra/${todaysMudra.slug}`)}
              className="overflow-hidden rounded-3xl bg-brand active:opacity-90"
            >
              <Image
                source={imageSource ?? undefined}
                contentFit="contain"
                style={{ height: 160, width: "100%" }}
                className="bg-brand-light/30"
              />
              <View className="p-5">
                <Text className="text-xl font-bold text-white">
                  {t(todaysMudra.name)}
                </Text>
                <Text className="mt-1 text-sm text-white/80" numberOfLines={2}>
                  {t(todaysMudra.description)}
                </Text>
                <Text className="mt-2 text-xs font-medium text-white/90">
                  {t("sugg")} · {todaysMudra.duration} {t("min")}
                </Text>
              </View>
            </Pressable>
          ) : (
            <EmptyState title={t("no_mudra")} subtitle={t("sync")} />
          )}
        </View>

        {/* Active Routine */}
        <View className="mt-6">
          <SectionTitle>{t("active_routine")}</SectionTitle>
          {activeRoutine ? (
            <View className="rounded-3xl bg-surface p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-ink flex-1 mr-4" numberOfLines={1}>
                  {t(activeRoutine.mudra.name)}
                </Text>
                <StreakBadge streak={activeRoutine.streak} />
              </View>
              <Text className="mt-1 text-sm text-muted">
                {t("daily_at")} {formatTime(activeRoutine.reminderTime)} ·{" "}
                {activeRoutine.duration} {t("min")}
              </Text>
              <View className="mt-4">
                <Button
                  label={t("start_practice")}
                  onPress={() => router.push(`/practice/${activeRoutine.id}`)}
                />
              </View>
            </View>
          ) : (
            <View className="rounded-3xl bg-surface p-5">
              <Text className="text-sm text-muted">
                {t("no_routine")}
              </Text>
              <View className="mt-4">
                <Button
                  label={t("ask_guide")}
                  variant="secondary"
                  onPress={() => router.push("/(tabs)/chat")}
                />
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="mt-6 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-surface p-5">
            <Text className="text-3xl font-bold text-brand">{topStreak}</Text>
            <Text className="text-xs text-muted">{t("best_streak")}</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-surface p-5">
            <Text className="text-3xl font-bold text-brand">
              {totalSessions}
            </Text>
            <Text className="text-xs text-muted">{t("session_done")}</Text>
          </View>
        </View>
        <View className="mt-6" style={{ marginHorizontal: -20 }}>
          <AdBanner />
        </View>
      </ScrollView>
    </Screen>
  );
}
