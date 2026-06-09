import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { TimePicker } from "@/components/TimePicker";
import { Button, Chip, Screen, SectionTitle } from "@/components/ui";
import { useUpdatePreferences } from "@/hooks/usePreferences";
import { requestNotificationPermissions } from "@/notifications";
import { WellnessGoal } from "@/types";

const GOALS: { key: WellnessGoal; label: string; emoji: string }[] = [
  { key: "anxiety", label: "Ease anxiety", emoji: "🌿" },
  { key: "stress", label: "Reduce stress", emoji: "🍃" },
  { key: "sleep", label: "Sleep better", emoji: "🌙" },
  { key: "energy", label: "More energy", emoji: "⚡" },
  { key: "focus", label: "Sharper focus", emoji: "🎯" },
  { key: "general", label: "General wellness", emoji: "🧘" },
];

export default function Onboarding() {
  const router = useRouter();
  const update = useUpdatePreferences();
  const [goal, setGoal] = useState<WellnessGoal | null>(null);
  const [time, setTime] = useState("07:30");

  const finish = async () => {




    // i want to request permissions before marking onboarding as complete, so that we can show the notification on time without needing to ask for permissions later

    // check if permissions are already granted, if not then request them
    // const { status } = await getNotificationPermissionsAsync();
    // if (status !== "granted") {
    //   const { status: newStatus } = await requestNotificationPermissions();
    //   if (newStatus !== "granted") {
    //     Alert.alert(
    //       "Permissions required",
    //       "Please enable notifications to receive your daily Mudra practice reminders.",
    //       [{ text: "OK" }]
    //     );
    //     return;
    //   }
    // }    
    // await requestNotificationPermissions();
    // await update.mutateAsync({
    //   wellnessGoal: goal ?? "general",
    //   preferredTime: time,
    //   onboardingCompleted: true,
    // });
    router.replace("/(tabs)");
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text className="mt-6 text-3xl font-bold text-ink">
          Welcome to{"\n"}Mudra AI 🙏
        </Text>
        <Text className="mt-2 text-base text-muted">
          Ancient hand gestures, guided by AI. Everything works offline once
          set up.
        </Text>

        <View className="mt-8">
          <SectionTitle>What brings you here?</SectionTitle>
          <View className="flex-row flex-wrap">
            {GOALS.map((g) => (
              <Chip
                key={g.key}
                label={`${g.emoji} ${g.label}`}
                active={goal === g.key}
                onPress={() => setGoal(g.key)}
              />
            ))}
          </View>
        </View>

        <View className="mt-6">
          <SectionTitle>When do you want to practice?</SectionTitle>
          <TimePicker value={time} onChange={setTime} />
        </View>

        <View className="mt-10">
          <Button
            label="Begin my practice"
            onPress={finish}
            loading={update.isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
