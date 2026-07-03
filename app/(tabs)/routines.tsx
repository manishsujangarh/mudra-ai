import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";

import { StreakBadge } from "@/components/StreakBadge";
import { Button, EmptyState, Screen } from "@/components/ui";
import { useActiveRoutines, useDeleteRoutine } from "@/hooks/useRoutines";
import { formatTime } from "@/lib/utils";
import { AdBanner } from "@/ads/AdBanner";
import { useTranslation } from "react-i18next";

export default function Routines() {
  const router = useRouter();
  const { data: routines = [], isLoading } = useActiveRoutines();
  const del = useDeleteRoutine();
  const { t } = useTranslation();

  return (
    <Screen>
      <View className="px-5 pt-3">
        <Text className="text-2xl font-bold text-ink">{t("your_routines")}</Text>
        <Text className="text-xs text-muted">
          {t("your_routines_dis")}
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
                {t(item.mudra.name)}
              </Text>
              <StreakBadge streak={item.streak} />
            </View>
            <Text className="mt-1 text-sm text-muted">
              {t("daily_at")} {formatTime(item.reminderTime)} · {item.duration} {t("min")}
            </Text>

            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label={t("practice")}
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
                <Text className="font-semibold text-muted">{t("remove")}</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title={t("no_routines")}
              subtitle={t("ask_routines")}
            />
          )
        }
      />

      <AdBanner />

    </Screen>
  );
}
