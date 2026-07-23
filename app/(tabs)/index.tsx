import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ScrollView, View, LayoutAnimation } from "react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MoodSelector } from "@/components/home/MoodSelector";
import { HeroCard } from "@/components/home/HeroCard";
import { MoodTrackingWidget } from "@/components/home/MoodTrackingWidget";
import { ProgressWidget } from "@/components/home/ProgressWidget";
import { PlanWidget } from "@/components/home/PlanWidget";
import { QuickReliefWidget } from "@/components/home/QuickReliefWidget";
import { AdBanner } from "@/ads/AdBanner";
import { useActiveRoutines, useCreateRoutine } from "@/hooks/useRoutines";
import { useStats, useMoodInsights } from "@/hooks/useSessions";
import { useTodaysMudra } from "@/hooks/useTodaysMudra";
import { PlanData, useAppStore } from "@/store/useAppStore";

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: todaysMudra } = useTodaysMudra();
  const { data: routines = [] } = useActiveRoutines();
  const { data: totalSessions = 0 } = useStats();
  const { data: insights } = useMoodInsights();
  const { mutateAsync: createRoutine, isPending: isCreating } = useCreateRoutine();

  // App Store (Zustand)
  const activePlans = useAppStore((s) => s.activePlans);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loadingMudraId, setLoadingMudraId] = useState<string | null>(null);
  const [savedMudras, setSavedMudras] = useState<string[]>([]);

  const topStreak = routines.reduce((max, r) => Math.max(max, r.streak), 0);
  const totalMinutes = totalSessions * 10;
  const consistencyRate = insights?.successRate ? Math.round(insights.successRate) : 0;

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["moodInsights"] });
    }, [queryClient])
  );

  // 📌 Handlers
  const handleMoodSelect = (moodId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedMood(selectedMood === moodId ? null : moodId);
  };

  const handleSaveMudra = (mudraId: string) => {
    if (savedMudras.includes(mudraId)) {
      setSavedMudras(savedMudras.filter(id => id !== mudraId));
    } else {
      setSavedMudras([...savedMudras, mudraId]);
    }
  };

  const handleStartPractice = async (mudraId: string, mudraNameKey: string, duration: number) => {
    try {
      setLoadingMudraId(mudraId);
      const existingRoutine = routines.find((r) => r.mudra.id === mudraId);

      if (existingRoutine) {
        router.push(`/practice/${existingRoutine.id}`);
      } else {
        const newRoutine = await createRoutine({
          mudraId: mudraId,
          mudraName: t(mudraNameKey),
          reminderTime: "07:30",
          duration: duration,
        });
        router.push(`/practice/${newRoutine.id}`);
      }
    } catch (error) {
      console.error("Failed to start practice:", error);
    } finally {
      setLoadingMudraId(null);
    }
  };

  // 🔥 Multi-Plan Continue Logic (With Safety Bypass)
  const handleContinuePlan = async (plan: PlanData) => {
    try {
      const mudraIndex = plan.currentDay - 1;
      let targetMudraId = plan.mudrasPerDay[mudraIndex] || plan.mudrasPerDay[0];

      if (routines && routines.length > 0) {
        const isValidId = routines.some(r => r.mudra.id === targetMudraId);
        if (!isValidId) {
          targetMudraId = routines[0].mudra.id;
        }
      }

      const existingRoutine = routines?.find((r) => r.mudra.id === targetMudraId);

      if (existingRoutine) {
        router.push(`/practice/${existingRoutine.id}`);
      } else {
        const newRoutine = await createRoutine({
          mudraId: targetMudraId,
          mudraName: "Challenge Practice",
          reminderTime: "08:00",
          duration: 5,
        });
        router.push(`/practice/${newRoutine.id}`);
      }
    } catch (error) {
      console.error("Failed to auto-create and start plan routine:", error);
    }
  };

  // 📝 Hero Card formatting
  const currentMudra = todaysMudra ? {
    id: todaysMudra.id,
    name: todaysMudra.name || "Adi Mudra",
    description: todaysMudra.description || "Calms the nervous system and prepares your mind for deep restful sleep.",
    imageUrl: todaysMudra.imageUrl,
    duration: todaysMudra.duration || 10,
    best_time: "before_bed",
    tag: "best_for_sleep"
  } : null;

  const isMudraSaved = currentMudra ? savedMudras.includes(currentMudra.id) : false;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <QuickReliefWidget
          routines={routines}
          onStartPractice={handleStartPractice}
          isCreating={isCreating}
        />



        <HeroCard
          mudra={currentMudra}
          isLoading={loadingMudraId === currentMudra?.id}
          isSaved={isMudraSaved}
          onStartPractice={handleStartPractice}
          onSaveMudra={handleSaveMudra}
        />


        <ProgressWidget
          topStreak={topStreak}
          totalMinutes={totalMinutes}
          totalSessions={totalSessions}
          consistencyRate={consistencyRate}
        />
        <MoodSelector
          selectedMood={selectedMood}
          onMoodSelect={handleMoodSelect}
        />

        {/* <PlanWidget
          activePlans={activePlans}
          onContinuePlan={handleContinuePlan}
        /> */}


        <MoodTrackingWidget
          insights={insights}
          onViewHistory={() => router.push("/screens/insights")}
        />
        <View className="mt-8" style={{ marginHorizontal: -20 }}>
          <AdBanner />
        </View>
      </ScrollView>
    </Screen>
  );
}
