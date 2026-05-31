import "../global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingScreen } from "@/components/ui";
import { useBootstrap } from "@/hooks/useBootstrap";
import { queryClient } from "@/lib/queryClient";

export default function RootLayout() {
  const { ready, error } = useBootstrap();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {!ready ? (
            <LoadingScreen
              message={error ? `Error: ${error}` : "Preparing your mudras…"}
            />
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
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
