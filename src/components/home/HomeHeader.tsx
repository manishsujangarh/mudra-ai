import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect, useRouter } from "expo-router";

export function HomeHeader() {
  const { t } = useTranslation();
  const router = useRouter();

  const [greetingKey, setGreetingKey] = useState("good_morning");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreetingKey("good_morning");
    else if (hour < 18) setGreetingKey("good_afternoon");
    else setGreetingKey("good_evening");
  }, []);

  useFocusEffect(
    useCallback(() => {
      // 1. Fetch User Auth Status
      const fetchUserData = async () => {
        try {
          const loggedStatus = await AsyncStorage.getItem("isLogged");
          if (loggedStatus === "true") {
            setIsLoggedIn(true);
            const name = await SecureStore.getItemAsync("user_name");
            if (name) setUserName(name);
          } else {
            setIsLoggedIn(false);
            setUserName("");
          }
        } catch (e) {
          console.log("Error fetching user data on Header:", e);
        }
      };

      // 2. Fetch Notifications Status (Dynamic Unread Logic)
      const checkUnreadNotifications = async () => {
        try {
          const storedNotifs = await AsyncStorage.getItem("app_notifications");
          if (storedNotifs) {
            const notifications = JSON.parse(storedNotifs);
            // चेक करें कि क्या ऐरे में कोई भी नोटिफिकेशन unread === true है
            const unreadExists = notifications.some((notif: any) => notif.unread === true);
            setHasUnread(unreadExists);
          } else {
            setHasUnread(false);
          }
        } catch (error) {
          console.error("Error checking unread notifications:", error);
          setHasUnread(false);
        }
      };

      fetchUserData();
      checkUnreadNotifications();
    }, [])
  );

  return (
    <View className="mt-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full border border-brand/40 bg-brand/5 items-center justify-center">
          <MaterialCommunityIcons name="flower-outline" size={20} color="#F97316" />
        </View>
        <View>
          <Text className="text-lg font-bold text-ink dark:text-white">
            {t(greetingKey)}, {isLoggedIn ? (userName || t("yogi")) : t("guest")} 👋
          </Text>
          <Text className="text-[11px] text-muted mt-0.5">{t("wellness_moment")}</Text>
        </View>
      </View>

      <Pressable
        className="relative p-2 bg-surface dark:bg-[#1A1A1A] border border-surface-light dark:border-gray-800 rounded-full active:opacity-70"
        onPress={() => router.push("/screens/notifications")}
      >
        <Ionicons name="notifications-outline" size={20} color="gray" />

        {/* 🔴 Dynamic Unread Dot */}
        {hasUnread && (
          <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface dark:border-[#1A1A1A]" />
        )}
      </Pressable>
    </View>
  );
}