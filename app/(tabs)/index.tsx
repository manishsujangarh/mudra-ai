import { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { Pressable, ScrollView, Text, View, LayoutAnimation, UIManager, Platform, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { StreakBadge } from "@/components/StreakBadge";
import { Button, EmptyState, SectionTitle, Screen } from "@/components/ui";
import { useActiveRoutines, useCreateRoutine } from "@/hooks/useRoutines";
import { useStats, useMoodInsights } from "@/hooks/useSessions";
import { useTodaysMudra } from "@/hooks/useTodaysMudra";
import { formatTime } from "@/lib/utils";
import { getMudraImage } from "@/utils/images";
import { AdBanner } from "@/ads/AdBanner";

const MOODS = [
  { id: "anxious", label: "mood_anxious", emoji: "😰" },
  { id: "stressed", label: "mood_stressed", emoji: "🤯" },
  { id: "low_energy", label: "mood_low_energy", emoji: "🔋" },
  { id: "sleep", label: "mood_sleep", emoji: "🌙" },
  { id: "focus", label: "mood_focus", emoji: "🎯" },
];

const MOOD_MUDRA_MAP: Record<string, { id: string; name: string; duration: number; tip: string; imageUrl: string }> = {
  anxious: { id: "mudra-vayu", name: "mudra-vayu_name", duration: 10, tip: "tip_vayu", imageUrl: "../assets/mudras/vayumudra.webp" },
  stressed: { id: "mudra-prana", name: "mudra-prana_name", duration: 15, tip: "tip_prana", imageUrl: "../assets/mudras/pranamudra.webp" },
  low_energy: { id: "mudra-surya", name: "mudra-surya_name", duration: 12, tip: "tip_surya", imageUrl: "../assets/mudras/suryamudra.webp" },
  sleep: { id: "mudra-adi", name: "mudra-adi_name", duration: 10, tip: "tip_adi", imageUrl: "../assets/mudras/adimudra.webp" },
  focus: { id: "mudra-buddhi", name: "mudra-buddhi_name", duration: 12, tip: "tip_buddhi", imageUrl: "../assets/mudras/budhamudra.webp" },
};

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient(); // 🔥 Hook for refreshing data

  const { data: todaysMudra } = useTodaysMudra();
  const { data: routines = [] } = useActiveRoutines();
  const { data: totalSessions = 0 } = useStats();
  const { data: insights } = useMoodInsights();
  const { mutateAsync: createRoutine, isPending: isCreating } = useCreateRoutine();

  const [greetingKey, setGreetingKey] = useState("good_morning");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loadingMudraId, setLoadingMudraId] = useState<string | null>(null);

  const activeRoutine = routines[0];
  const topStreak = routines.reduce((max, r) => Math.max(max, r.streak), 0);

  // 🔥 REAL-TIME UPDATE LOGIC: Jab bhi Home screen focus me aayegi, data refresh hoga
  useFocusEffect(
    useCallback(() => {
      // Refresh these queries automatically
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["moodInsights"] });
      // queryClient.invalidateQueries({ queryKey: ["todaysMudra"] }); // Optional
    }, [queryClient])
  );

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreetingKey("good_morning");
    else if (hour < 18) setGreetingKey("good_afternoon");
    else setGreetingKey("good_evening");
  }, []);

  const handleMoodSelect = (moodId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedMood(selectedMood === moodId ? null : moodId);
  };

  const handleStartPractice = async (mudraId: string, mudraNameKey: string, duration: number) => {
    try {
      setLoadingMudraId(mudraId);
      const existingRoutine = routines.find(r => r.mudra.id === mudraId);

      if (existingRoutine) {
        const moodParam = selectedMood ? `?initialMood=${selectedMood}` : "";
        router.push(`/practice/${existingRoutine.id}${moodParam}`);
      } else {
        const currentTime = new Date();
        const timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

        const newRoutine = await createRoutine({
          mudraId: mudraId,
          mudraName: t(mudraNameKey),
          reminderTime: timeString,
          duration: duration,
        });
        const moodParam = selectedMood ? `?initialMood=${selectedMood}` : "";
        router.push(`/practice/${newRoutine.id}${moodParam}`);
      }
    } catch (error) {
      console.error("Failed to start practice:", error);
    } finally {
      setLoadingMudraId(null);
    }
  };

  // DYNAMIC HERO LOGIC
  const frequentMoodId = insights?.mostFrequentMood;
  const dynamicPick = frequentMoodId ? MOOD_MUDRA_MAP[frequentMoodId] : null;

  const displayId = dynamicPick ? dynamicPick.id : todaysMudra?.id;
  const displayNameKey = dynamicPick ? dynamicPick.name : todaysMudra?.name;
  const displayDescKey = dynamicPick ? dynamicPick.tip : todaysMudra?.description;
  const displayDuration = dynamicPick ? dynamicPick.duration : todaysMudra?.duration;

  const displayImageRaw = dynamicPick ? dynamicPick.imageUrl : todaysMudra?.imageUrl;
  const displayImage = getMudraImage(displayImageRaw);

  const heroSubtitle = dynamicPick
    ? `${t("recommended_for")} ${t(MOODS.find(m => m.id === frequentMoodId)?.label || "")}`
    : (greetingKey === "good_evening" ? t("wind_down") : t("todays_pick"));

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View className="mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-muted">{t("namaste")} 🙏</Text>
            <Text className="text-2xl font-bold text-ink">{t("your_practice")}</Text>
          </View>
          <StreakBadge streak={topStreak} />
        </View>

        {/* SECTION 1: TODAY'S DYNAMIC RECOMMENDATION */}
        <View className="mt-6 overflow-hidden rounded-3xl bg-brand relative min-h-[160px]">
          <Image
            source={displayImage ?? undefined}
            contentFit="contain"
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.3 }}
          />
          <View className="absolute w-full h-full bg-black/40" />

          <View className="p-5 relative z-10">
            <Text className="text-xs font-bold text-white/90 uppercase tracking-widest mb-1">
              {heroSubtitle}
            </Text>

            {displayId ? (
              <>
                <Text className="text-2xl font-bold text-white mb-2">
                  {t(displayNameKey || "")}
                </Text>
                <Text className="text-sm text-white/90 mb-4" numberOfLines={2}>
                  {t(displayDescKey || "")}
                </Text>

                <View className="flex-row gap-3">
                  <Pressable
                    disabled={isCreating}
                    onPress={() => handleStartPractice(displayId, displayNameKey || "", displayDuration || 10)}
                    className="bg-surface px-5 py-2.5 rounded-full flex-row items-center justify-center min-w-[120px] active:opacity-80"
                  >
                    {loadingMudraId === displayId ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text className="text-brand font-bold text-center">
                        {t("start_practice")} {displayDuration} {t("min")}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <EmptyState title={t("no_mudra")} subtitle={t("sync")} />
            )}
          </View>
        </View>

        {/* SECTION 2: PROGRESS INSIGHTS */}
        {insights && insights.totalAnalyzed >= 3 && (
          <View className="mt-8">
            <SectionTitle>{t("your_progress")}</SectionTitle>
            <View className="mt-2 bg-surface rounded-3xl p-5 border border-surface-light">
              <View className="flex-row items-center mb-3">
                <Text className="text-3xl mr-3">{insights.successRate > 50 ? "📈" : "🌱"}</Text>
                <View className="flex-1">
                  <Text className="text-base font-bold text-ink">
                    {insights.successRate > 50 ? t("making_progress") : t("building_consistency")}
                  </Text>
                  <Text className="text-sm text-muted mt-1 leading-5">
                    {t("felt_better_after")} <Text className="font-bold text-brand">{insights.successRate}%</Text> {t("of_recent_sessions")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 3: MOOD CHECK-IN (🔥 SCROLL FIX APPLIED HERE) */}
        <View className="mt-8">
          <SectionTitle>{t("how_are_you_feeling")}</SectionTitle>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20, marginTop: 8 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {MOODS.map((mood) => (
              <Pressable
                key={mood.id}
                onPress={() => handleMoodSelect(mood.id)}
                className={`flex-row items-center px-2 py-2 rounded-full border ${selectedMood === mood.id ? "bg-brand border-brand" : "bg-surface border-surface-light"}`}
              >
                <Text className="mr-1 text-md">{mood.emoji}</Text>
                <Text className={`font-medium ${selectedMood === mood.id ? "text-white" : "text-ink"}`}>
                  {t(mood.label)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* DYNAMIC MOOD RECOMMENDATION */}
          {selectedMood && MOOD_MUDRA_MAP[selectedMood] && (
            <View className="mt-4 p-4 rounded-2xl bg-surface border border-surface-light overflow-hidden">
              <Text className="text-sm font-bold text-ink">
                {t("recommended_for")} {t(MOODS.find(m => m.id === selectedMood)?.label || "")}
              </Text>
              <Text className="text-xs text-muted mt-1 mb-4">
                {t(MOOD_MUDRA_MAP[selectedMood].name)} · {MOOD_MUDRA_MAP[selectedMood].duration} {t("min")} · {t(MOOD_MUDRA_MAP[selectedMood].tip)}
              </Text>
              <Button
                label={t("start_quick_practice")}
                loading={loadingMudraId === MOOD_MUDRA_MAP[selectedMood].id}
                onPress={() => handleStartPractice(
                  MOOD_MUDRA_MAP[selectedMood].id,
                  MOOD_MUDRA_MAP[selectedMood].name,
                  MOOD_MUDRA_MAP[selectedMood].duration
                )}
              />
            </View>
          )}
        </View>

        {/* SECTION 4: YOUR NEXT SCHEDULED PRACTICE */}
        <View className="mt-8">
          <SectionTitle>{t("active_routine")}</SectionTitle>
          {activeRoutine ? (
            <View className="rounded-3xl bg-surface p-5 mt-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-bold text-ink flex-1 mr-4" numberOfLines={1}>
                  {t(activeRoutine.mudra.name)}
                </Text>
                <Text className="text-sm font-medium text-brand">{activeRoutine.duration} {t("min")}</Text>
              </View>
              <View className="flex-row items-center gap-2 mb-4">
                <Text className="text-sm text-muted">{t("daily_at")} {formatTime(activeRoutine.reminderTime)}</Text>
                <Text className="text-muted">•</Text>
                <Text className="text-sm text-muted font-medium">{activeRoutine.streak} {t("day_streak")} 🔥</Text>
              </View>
              <Button label={t("start_practice")} onPress={() => router.push(`/practice/${activeRoutine.id}`)} />
            </View>
          ) : (
            <View className="rounded-3xl bg-surface p-5 mt-2">
              <Text className="text-sm text-muted">{t("no_routine")}</Text>
              <View className="mt-4">
                <Button label={t("ask_guide")} variant="secondary" onPress={() => router.push("/(tabs)/chat")} />
              </View>
            </View>
          )}
        </View>

        {/* SECTION 5: STATS */}
        <View className="mt-6 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-surface p-5">
            <Text className="text-xs text-muted font-medium uppercase tracking-wider mb-1">{t("best_streak")}</Text>
            <Text className="text-2xl font-bold text-brand">{topStreak}</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-surface p-5">
            <Text className="text-xs text-muted font-medium uppercase tracking-wider mb-1">{t("session_done")}</Text>
            <Text className="text-2xl font-bold text-brand">{totalSessions}</Text>
          </View>
        </View>

        <View className="mt-8" style={{ marginHorizontal: -20 }}>
          <AdBanner />
        </View>
      </ScrollView>
    </Screen>
  );
}
