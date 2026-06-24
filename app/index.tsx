import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/ui";
import { usePreferences } from "@/hooks/usePreferences";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Entry gate: send first-time users to onboarding, otherwise into the app. */
export default function Index() {
  const { data: prefs, isLoading } = usePreferences();

  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem("has_seen_onboarding");
        setHasSeenOnboarding(value === "true");
      } catch (e) {
        setHasSeenOnboarding(false);
      } finally {
        setIsReady(true);
      }
    };
    checkOnboarding();
  }, []);

  if (!isReady || isLoading) {
    return <LoadingScreen />;
  }
  const isCompleted = prefs?.onboardingCompleted || hasSeenOnboarding;

  return (
    <Redirect href={isCompleted ? "/(tabs)" : "/onboarding"} />
  );
}
