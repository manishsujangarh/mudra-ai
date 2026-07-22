import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";

import { useSessionCompletionInterstitial } from "@/ads/useSessionCompletionInterstitial";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button, LoadingScreen, SectionTitle } from "@/components/ui";
import { useRoutine } from "@/hooks/useRoutines";
import { useCompleteSession } from "@/hooks/useSessions";
import { getMudraImage } from "@/utils/images";
import { Ionicons } from "@expo/vector-icons";

// Mood Data with Translation Keys
const PRE_MOODS = [
  { id: "stressed", label: "mood_stressed", emoji: "🤯" },
  { id: "anxious", label: "mood_anxious", emoji: "😰" },
  { id: "restless", label: "mood_restless", emoji: "😵‍💫" },
  { id: "tired", label: "mood_tired", emoji: "🥱" },
  { id: "distracted", label: "mood_distracted", emoji: "🥴" },
];

const POST_MOODS = [
  { id: "calmer", label: "mood_calmer", emoji: "😌" },
  { id: "lighter", label: "mood_lighter", emoji: "🕊️" },
  { id: "focused", label: "mood_focused", emoji: "🎯" },
  { id: "sleepy", label: "mood_sleepy", emoji: "😴" },
  { id: "same", label: "mood_same", emoji: "😐" },
];

export default function Practice() {
  // 🔥 Read `initialMood` from the URL route parameters
  const { id, initialMood } = useLocalSearchParams<{ id: string; initialMood?: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: routine, isLoading } = useRoutine(id);
  const complete = useCompleteSession();
  const sessionCompletionAd = useSessionCompletionInterstitial();

  // 🔥 Smart Initial State: If initialMood is passed, skip "pre" and go to "practice"
  const [step, setStep] = useState<"pre" | "practice" | "post">(initialMood ? "practice" : "pre");
  const [preMood, setPreMood] = useState<string | null>(initialMood || null);
  const [postMood, setPostMood] = useState<string | null>(null);
  const [timerDone, setTimerDone] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (!routine) {
    return (
      <View className="flex-1 items-center justify-center bg-sand">
        <Text className="text-muted">{t("routine_not_found")}</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-semibold text-brand">{t("close")}</Text>
        </Pressable>
      </View>
    );
  }

  // Handle final completion
  const handleFinalCompletion = async (selectedPostMood: string) => {
    setPostMood(selectedPostMood);

    const { streak } = await complete.mutateAsync({
      routineId: routine.id,
      preMood: preMood,
      postMood: selectedPostMood
    });

    sessionCompletionAd.showAfterCompletion(() => {
      Alert.alert(
        `${t("session_complete")} 🎉`,
        `${t("session_complete_sub")} ${streak} ${streak === 1 ? t("day") : t("days")}.`,
        [{ text: t("done"), onPress: () => router.back() }]
      );
    });
  };

  const { mudra } = routine;
  const imageSource = getMudraImage(mudra.imageUrl);

  // ---------------------------------------------------------
  // STEP 1 - PRE-CHECK-IN (Will be skipped if initialMood exists)
  // ---------------------------------------------------------
  if (step === "pre") {
    return (
      <View className="flex-1 bg-sand justify-center px-5">
        <Text className="text-3xl font-bold text-ink text-center mb-2">{t("check_in")}</Text>
        <Text className="text-base text-muted text-center mb-10">{t("how_feel_now")}</Text>

        <View className="flex-row flex-wrap justify-center gap-3">
          {PRE_MOODS.map((mood) => (
            <Pressable
              key={mood.id}
              onPress={() => {
                setPreMood(mood.id);
                setStep("practice");
              }}
              className="bg-surface border border-surface-light px-6 py-4 rounded-2xl items-center min-w-[140px] active:opacity-80"
            >
              <Text className="text-3xl mb-2">{mood.emoji}</Text>
              <Text className="font-medium text-ink">{t(mood.label)}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => setStep("practice")} className="mt-10 p-4 items-center active:opacity-70">
          <Text className="text-muted font-medium">{t("skip_for_now")}</Text>
        </Pressable>
      </View>
    );
  }

  // ---------------------------------------------------------
  // STEP 3 - POST-CHECK-IN
  // ---------------------------------------------------------
  if (step === "post") {
    return (
      <View className="flex-1 bg-sand justify-center px-5">
        <Text className="text-3xl font-bold text-ink text-center mb-2">{t("well_done")}</Text>
        <Text className="text-base text-muted text-center mb-10">{t("how_feel_after")}</Text>

        <View className="flex-row flex-wrap justify-center gap-3">
          {POST_MOODS.map((mood) => (
            <Pressable
              key={mood.id}
              onPress={() => handleFinalCompletion(mood.id)}
              disabled={complete.isPending}
              className="bg-surface border border-surface-light px-6 py-4 rounded-2xl items-center min-w-[140px] active:opacity-80"
            >
              {complete.isPending && postMood === mood.id ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text className="text-3xl mb-2">{mood.emoji}</Text>
                  <Text className="font-medium text-ink">{t(mood.label)}</Text>
                </>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------
  // STEP 2 - PRACTICE
  // ---------------------------------------------------------
  return (
    <View className="flex-1 bg-sand">
      <View className="flex-row items-center justify-between px-5 pt-14">
        <Text className="text-lg font-bold text-ink flex-1 mr-4" numberOfLines={1}>
          {t(mudra.name)}
        </Text>
        <Pressable onPress={() => router.back()} className="p-2">
          <Text className="text-base text-muted">✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <View className="items-center mt-6 mb-8">
          <View className="w-32 h-32 rounded-full items-center justify-center border border-brand/40 relative">
            <View className="absolute w-36 h-36 rounded-full bg-brand/10 blur-2xl" />
            <Image
              source={imageSource ?? undefined}
              contentFit="cover"
              style={{ height: 110, width: 110, borderRadius: 55 }}
              className="bg-slate-100 dark:bg-[#1A1A1A]"
            />
          </View>
        </View>

        <Pressable
          onPress={() => router.push(`/verify-mudra/${mudra.id}`)}
          className="flex-row items-center justify-center bg-brand/5 border border-brand/20 p-4 rounded-full mt-4 active:opacity-70"
        >
          <Ionicons name="scan-outline" size={14} color="#F97316" />
          <Text className="text-brand text-xs font-bold ml-2">
            {t("Check Posture AI")}
          </Text>
        </Pressable>

        <View className="mt-8">
          <CountdownTimer
            minutes={routine.duration}
            onComplete={() => setTimerDone(true)}
          />
        </View>

        <View className="mt-10 mb-8">
          <Button
            label={timerDone ? t("complete_session") : t("complete_session_early")}
            onPress={() => setStep("post")}
            variant={timerDone ? "primary" : "secondary"}
          />
        </View>

        {mudra.instructions.length > 0 && (
          <View className="mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-900 dark:text-white">{t("steps") || "Steps"}</Text>
              <Text className="text-xs text-slate-500 dark:text-gray-400">{mudra.instructions.length} {t("steps") || "Steps"}</Text>
            </View>
            {mudra.instructions.map((step, i) => (
              <View key={i} className="mb-3 flex-row items-start">
                <View className="mr-3 h-5 w-5 items-center justify-center rounded-full bg-brand/10 border border-brand/20 mt-0.5">
                  <Text className="text-[10px] font-bold text-brand">{i + 1}</Text>
                </View>
                <Text className="flex-1 text-sm leading-6 text-slate-600 dark:text-gray-300">{t(step)}</Text>
              </View>
            ))}
          </View>
        )}

        {mudra.benefits.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-900 dark:text-white">{t("benefits") || "Benefits"}</Text>
              <Text className="text-xs text-slate-500 dark:text-gray-400">{mudra.benefits.length} {t("benefits")?.toLowerCase() || "benefits"}</Text>
            </View>
            {mudra.benefits.map((b, i) => (
              <View key={i} className="mb-2.5 flex-row items-start">
                <Ionicons name="checkmark-circle-outline" size={18} color="#FF9500" className="mt-0.5 mr-3" />
                <Text className="flex-1 text-sm leading-6 text-slate-600 dark:text-gray-300">{t(b)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}