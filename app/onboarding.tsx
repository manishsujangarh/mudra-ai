import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Alert } from "react-native";
import { TimePicker } from "@/components/TimePicker";
import { Button, Chip, Screen, SectionTitle } from "@/components/ui";
import { useUpdatePreferences } from "@/hooks/usePreferences";
import { cancelReminder, requestNotificationPermissions } from "@/notifications";
import { WellnessGoal } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateNotificationTime } from "@/notifications";
import { useLocalSearchParams } from "expo-router";

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
  const [time, setTime] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const isEditMode = params.mode === 'edit_notification';

  const titleText = isEditMode ? "Update Reminder" : "Welcome to\nMudra AI 🙏";
  const subTitleText = isEditMode
    ? "Adjust the time for your daily practice reminder."
    : "Ancient hand gestures, guided by AI. Everything works offline once set up.";
  const buttonLabel = isEditMode ? "Save Changes" : "Begin my practice";

  useEffect(() => {
    const loadSavedTime = async () => {
      const savedTime = await AsyncStorage.getItem("daily_notification_time");
      setTime(savedTime || "07:30");
    };
    loadSavedTime();
  }, []);

  const finish = async () => {
    try {
      // 1. Notification Permission request karein
      const granted = await requestNotificationPermissions();

      const existingId = await AsyncStorage.getItem("last_notif_id");
      if (existingId) {
        await cancelReminder(existingId);
      }

      // 2. Agar permission granted hai, toh notification schedule karein
      if (granted) {
        // Hum ek generic daily reminder schedule kar rahe hain
        const notifId = await updateNotificationTime({
          time: String(time),
        });

        if (notifId) {
          await AsyncStorage.setItem("last_notif_id", notifId);
        }
      } else {
        // Permission deny hui, lekin hum aage badhne denge (bug-free)
        console.log("Notifications disabled by user");
      }

      // 3. Normal Onboarding Flow (agar edit mode nahi hai)
      if (!isEditMode) {
        await update.mutateAsync({
          wellnessGoal: goal ?? "general",
          preferredTime: time,
          onboardingCompleted: true,
        });
        await AsyncStorage.setItem("has_seen_onboarding", "true");
      }

      // 4. Time save karein
      await AsyncStorage.setItem("daily_notification_time", String(time));

      // 5. Navigate
      if (isEditMode) {
        router.back(); // Settings mein wapas
      } else {
        router.replace("/(tabs)"); // Home par
      }
    } catch (error) {
      console.error("Onboarding finish error:", error);
      Alert.alert("Error", "Could not complete setup. Please try again.");
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text className="mt-6 text-3xl font-bold text-ink">
          {titleText}
        </Text>
        <Text className="mt-2 text-base text-muted">
          {subTitleText}
        </Text>

        {!isEditMode && (
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
        )}

        <View className="mt-6">
          <SectionTitle>{isEditMode ? "Set New Time" : "When do you want to practice?"}</SectionTitle>
          {time !== null ? (
            <TimePicker value={time} onChange={setTime} />
          ) : (
            <ActivityIndicator size="small" className="mt-4" />
          )}
        </View>

        <View className="mt-10">
          <Button
            label={buttonLabel}
            onPress={finish}
            loading={update.isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
