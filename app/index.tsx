import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/ui";
import { usePreferences } from "@/hooks/usePreferences";

/** Entry gate: send first-time users to onboarding, otherwise into the app. */
export default function Index() {
  const { data: prefs, isLoading } = usePreferences();

  if (isLoading || !prefs) {
    return <LoadingScreen />;
  }

  return (
    <Redirect href={prefs.onboardingCompleted ? "/(tabs)" : "/onboarding"} />
  );
}
