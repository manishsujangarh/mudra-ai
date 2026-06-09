import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { useSessionCompletionInterstitial } from "@/ads/useSessionCompletionInterstitial";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button, LoadingScreen, SectionTitle } from "@/components/ui";
import { useRoutine } from "@/hooks/useRoutines";
import { useCompleteSession } from "@/hooks/useSessions";

export default function Practice() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: routine, isLoading } = useRoutine(id);
  const complete = useCompleteSession();
  const [timerDone, setTimerDone] = useState(false);
  const sessionCompletionAd = useSessionCompletionInterstitial();

  if (isLoading) return <LoadingScreen />;
  if (!routine) {
    return (
      <View className="flex-1 items-center justify-center bg-sand">
        <Text className="text-muted">Routine not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-semibold text-brand">Close</Text>
        </Pressable>
      </View>
    );
  }

  const onComplete = async () => {
    const { streak } = await complete.mutateAsync(routine.id);
    sessionCompletionAd.showAfterCompletion(() => {
      Alert.alert(
        "Session complete 🎉",
        `Great work! Your streak is now ${streak} day${streak === 1 ? "" : "s"}.`,
        [{ text: "Done", onPress: () => router.back() }]
      );
    });
  };

  const { mudra } = routine;

  return (
    <View className="flex-1 bg-sand">
      <View className="flex-row items-center justify-between px-5 pt-14">
        <Text className="text-lg font-bold text-ink">{mudra.name}</Text>
        <Pressable onPress={() => router.back()} className="p-2">
          <Text className="text-base text-muted">✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <View className="items-center">
          <Image
            source={mudra.imageUrl ?? undefined}
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
            label={timerDone ? "Complete Session" : "Complete Session Early"}
            onPress={onComplete}
            loading={complete.isPending}
            variant={timerDone ? "primary" : "secondary"}
          />
        </View>

        {mudra.instructions.length > 0 && (
          <View className="mt-8">
            <SectionTitle>Steps</SectionTitle>
            {mudra.instructions.map((step, i) => (
              <View key={i} className="mb-2 flex-row">
                <Text className="mr-2 font-bold text-brand">{i + 1}.</Text>
                <Text className="flex-1 text-sm text-ink">{step}</Text>
              </View>
            ))}
          </View>
        )}

        {mudra.benefits.length > 0 && (
          <View className="mt-6">
            <SectionTitle>Benefits</SectionTitle>
            {mudra.benefits.map((b, i) => (
              <View key={i} className="mb-1 flex-row">
                <Text className="mr-2 text-brand">✓</Text>
                <Text className="flex-1 text-sm text-ink">{b}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
