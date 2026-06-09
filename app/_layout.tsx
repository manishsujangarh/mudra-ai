import "../global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AdBanner } from "@/ads/AdBanner";
import { MobileAdsInitializer } from "@/ads/MobileAdsInitializer";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { LoadingScreen } from "@/components/ui";
import { useBootstrap } from "@/hooks/useBootstrap";
import { queryClient } from "@/lib/queryClient";

export default function RootLayout() {
  const { ready, error } = useBootstrap();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const headerBackground = isDark ? "#121413" : "#F5F2F1";
  const headerTint = isDark ? "#F6F1EC" : "#111111";

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
          {ready ? <AdBanner /> : null}
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
