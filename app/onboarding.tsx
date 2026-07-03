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
import { useTranslation } from "react-i18next";

const GOALS: { key: WellnessGoal; label: string; emoji: string }[] = [
  { key: "anxiety", label: "goals_1", emoji: "🌿" },
  { key: "stress", label: "goals_2", emoji: "🍃" },
  { key: "sleep", label: "goals_3", emoji: "🌙" },
  { key: "energy", label: "goals_4", emoji: "⚡" },
  { key: "focus", label: "goals_5", emoji: "🎯" },
  { key: "general", label: "goals_6", emoji: "🧘" },
];

export default function Onboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const update = useUpdatePreferences();
  const [goal, setGoal] = useState<WellnessGoal | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const isEditMode = params.mode === 'edit_notification';

  const titleText = isEditMode ? t("update_reminder") : `${t("welcome")} 🙏`;
  const subTitleText = isEditMode
    ? t("update_reminder_sub")
    : t("welcome_sub");
  const buttonLabel = isEditMode ? t("save_changes") : t("my_practice");

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
            <SectionTitle>{t("what_brings")}</SectionTitle>
            <View className="flex-row flex-wrap">
              {GOALS.map((g) => (
                <Chip
                  key={g.key}
                  label={`${g.emoji} ${t(g.label)}`}
                  active={goal === g.key}
                  onPress={() => setGoal(g.key)}
                />
              ))}
            </View>
          </View>
        )}

        <View className="mt-6">
          <SectionTitle>{isEditMode ? t("set_time") : t("want_practice")}</SectionTitle>
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
