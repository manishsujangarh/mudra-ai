import "../global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { AdBanner } from "@/ads/AdBanner";
import { MobileAdsInitializer } from "@/ads/MobileAdsInitializer";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { LoadingScreen } from "@/components/ui";
import { useBootstrap } from "@/hooks/useBootstrap";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import { queryPremiumOwnershipStatus } from "@/utils/iap";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const { ready, error } = useBootstrap();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const headerBackground = isDark ? "#121413" : "#F5F2F1";
  const headerTint = isDark ? "#F6F1EC" : "#111111";
  const insects = useSafeAreaInsets();
  const router = useRouter();

  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const silentRestore = async () => {
      try {
        const ownershipStatus = await queryPremiumOwnershipStatus();

        if (ownershipStatus?.hasPremium) {
          await AsyncStorage.setItem("mudra_ai_is_premium", "true");
        } else {
          await AsyncStorage.setItem("mudra_ai_is_premium", "false");
        }
      } catch (error) {
        console.log("Silent premium check failed", error);
      }
    };

    silentRestore();
  }, []);

  useEffect(() => {
    if (lastNotificationResponse) {
      const data = lastNotificationResponse.notification.request.content.data;

      if (data?.type === "practice" && data?.routineId) {
        if (ready) {
          router.push(`/practice/${data.routineId}`);
        }
      }
    }
  }, [lastNotificationResponse, ready, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <MobileAdsInitializer />
          <StatusBar style={isDark ? "light" : "dark"} />
          {!ready ? (
            <LoadingScreen
              message={error ? `Error: ${error}` : "Preparing your mudras…"}
            />
          ) : (
            <Stack
              screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: headerBackground },
                headerTintColor: headerTint,
                headerShadowVisible: false,
                headerRight: () => <SettingsHeaderRight />,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: true,
                  title: "",
                }}
              />
              <Stack.Screen
                name="mudra/[slug]"
                options={{ headerShown: true, title: "Mudra" }}
              />
              <Stack.Screen
                name="practice/[id]"
                options={{ presentation: "fullScreenModal" }}
              />
              <Stack.Screen
                name="routine-builder"
                options={{
                  presentation: "modal",
                  headerShown: true,
                  title: "Build Routine",
                }}
              />
            </Stack>
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function SettingsHeaderRight() {
  const router = useRouter();

  return (
    <View className="flex-row items-center">
      <Pressable onPress={() => router.push("/settings" as any)} className="p-2 mr-2">
        <Text className="text-base text-muted">⚙️</Text>
      </Pressable>
      <ThemeSwitch />
    </View>
  );
}
