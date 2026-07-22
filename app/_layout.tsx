import "../global.css";
import '../src/i18n';
import { Ionicons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router as appRouter, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DeviceEventEmitter, Pressable, View } from "react-native";
import * as Notifications from "expo-notifications";
import { MobileAdsInitializer } from "@/ads/MobileAdsInitializer";
import { LoadingScreen } from "@/components/ui";
import { useBootstrap } from "@/hooks/useBootstrap";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import { queryPremiumOwnershipStatus } from "@/utils/iap";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useTranslation } from "react-i18next";

export default function RootLayout() {
  const { t } = useTranslation();

  useEffect(() => {
    const syncMissedNotifications = async () => {
      try {
        const presentedNotifs = await Notifications.getPresentedNotificationsAsync();

        const storedNotifs = await AsyncStorage.getItem("app_notifications");
        const existingNotifs = storedNotifs ? JSON.parse(storedNotifs) : [];
        let hasNew = false;

        presentedNotifs.forEach((p) => {
          const newNotif = {
            id: p.request.identifier,
            title: p.request.content.title,
            desc: p.request.content.body,
            time: p.date || Date.now(),
            unread: true,
            data: p.request.content.data,
          };

          if (!existingNotifs.some((n: any) => n.id === newNotif.id)) {
            existingNotifs.unshift(newNotif);
            hasNew = true;
          }
        });

        if (hasNew) {
          await AsyncStorage.setItem("app_notifications", JSON.stringify(existingNotifs));
        }
      } catch (error) {
        console.error("Error syncing missed notifications:", error);
      }
    };

    syncMissedNotifications();

    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const newNotif = {
        id: notification.request.identifier,
        title: notification.request.content.title,
        desc: notification.request.content.body,
        time: Date.now(),
        unread: true,
        data: notification.request.content.data,
      };

      try {
        const storedNotifs = await AsyncStorage.getItem("app_notifications");
        const existingNotifs = storedNotifs ? JSON.parse(storedNotifs) : [];

        if (!existingNotifs.some((n: any) => n.id === newNotif.id)) {
          const updatedNotifs = [newNotif, ...existingNotifs];
          await AsyncStorage.setItem("app_notifications", JSON.stringify(updatedNotifs));
        }
      } catch (error) {
        console.error("Error saving foreground notification", error);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const initKeepAwake = async () => {
      try {
        const keepAwakeState = await AsyncStorage.getItem("keep_screen_awake");

        if (keepAwakeState === "false") {
          deactivateKeepAwake();
        } else {
          await activateKeepAwakeAsync();
        }
      } catch (e) {
        console.error("Keep awake error:", e);
      }
    };

    initKeepAwake();
    const subscription = DeviceEventEmitter.addListener("KeepAwakeUpdated", initKeepAwake);
    return () => subscription.remove();
  }, []);

  const { ready, error } = useBootstrap();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const headerBackground = isDark ? "#000000" : "#F2F2F7";
  const headerTint = isDark ? "#F2F2F7" : "#1C1C1E";

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
    if (lastNotificationResponse && ready) {
      const data = lastNotificationResponse.notification.request.content.data;

      if (data?.type === "practice" && data?.routineId) {
        appRouter.push(`/practice/${data.routineId}`);
      } else {
        appRouter.replace("/(tabs)");
      }
    }
  }, [lastNotificationResponse, ready]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <MobileAdsInitializer />
          <StatusBar style={isDark ? "light" : "dark"} />
          {!ready ? (
            <LoadingScreen
              message={error ? `Error: ${error}` : t("preparing")}
            />
          ) : (
            <Stack
              screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: headerBackground },
                headerTintColor: headerTint,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: headerBackground },
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
                  title: t("build_routine"),
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


  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={() => appRouter.push("/settings" as any)}
        className="p-2 mr-2"
      >
        <Ionicons name="settings-outline" size={24} color="#777777" />
      </Pressable>
    </View>
  );
}
