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
        <View className="items-center">
          <Image
            source={imageSource ?? undefined}
            contentFit="cover"
            style={{ height: 140, width: 140, borderRadius: 70 }}
            className="bg-brand-light/30"
          />
        </View>

        <View className="mt-8">
          <CountdownTimer
            minutes={routine.duration}
            onComplete={() => setTimerDone(true)}
          />
        </View>

        <View className="mt-10">
          <Button
            label={timerDone ? t("complete_session") : t("complete_session_early")}
            onPress={() => setStep("post")}
            variant={timerDone ? "primary" : "secondary"}
          />
        </View>

        {mudra.instructions.length > 0 && (
          <View className="mt-8">
            <SectionTitle>{t("steps")}</SectionTitle>
            {mudra.instructions.map((step, i) => (
              <View key={i} className="mb-2 flex-row">
                <Text className="mr-2 font-bold text-brand">{i + 1}.</Text>
                <Text className="flex-1 text-sm text-ink">{t(step)}</Text>
              </View>
            ))}
          </View>
        )}

        {mudra.benefits.length > 0 && (
          <View className="mt-6">
            <SectionTitle>{t("benefits")}</SectionTitle>
            {mudra.benefits.map((b, i) => (
              <View key={i} className="mb-1 flex-row">
                <Text className="mr-2 text-brand">✓</Text>
                <Text className="flex-1 text-sm text-ink">{t(b)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}