import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';

import { Screen } from "@/components/ui";
import { BackButton } from "@/components/BackButton";
import { useTranslation } from "react-i18next";

const formatTimeAgo = (timestamp: number) => {
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return `Just now`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);

  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useFocusEffect(
    useCallback(() => {
      const syncAllNotifications = async () => {
        try {
          const storedNotifs = await AsyncStorage.getItem("app_notifications");
          let allNotifs = storedNotifs ? JSON.parse(storedNotifs) : [];
          let hasNew = false;

          const presentedNotifs = await Notifications.getPresentedNotificationsAsync();
          presentedNotifs.forEach((p) => {
            const id = p.request.identifier;
            if (!allNotifs.some((n: any) => n.id === id)) {
              allNotifs.unshift({
                id,
                title: p.request.content.title,
                desc: p.request.content.body,
                time: p.date || Date.now(),
                unread: true,
                data: p.request.content.data,
              });
              hasNew = true;
            }
          });

          if (lastNotificationResponse) {
            const clickedNotif = lastNotificationResponse.notification;
            const id = clickedNotif.request.identifier;
            if (!allNotifs.some((n: any) => n.id === id)) {
              allNotifs.unshift({
                id,
                title: clickedNotif.request.content.title,
                desc: clickedNotif.request.content.body,
                time: clickedNotif.date || Date.now(),
                unread: false,
                data: clickedNotif.request.content.data,
              });
              hasNew = true;
            }
          }

          if (hasNew) {
            allNotifs.sort((a: any, b: any) => b.time - a.time);
            await AsyncStorage.setItem("app_notifications", JSON.stringify(allNotifs));
          }

          setNotifications(allNotifs);
        } catch (error) {
          console.error("Error syncing notifications:", error);
        }
      };

      syncAllNotifications();
    }, [lastNotificationResponse])
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const newNotif = {
        id: notification.request.identifier,
        title: notification.request.content.title,
        desc: notification.request.content.body,
        time: notification.date || Date.now(),
        unread: true,
        data: notification.request.content.data,
      };

      setNotifications((prevNotifs) => {
        if (!prevNotifs.some((n) => n.id === newNotif.id)) {
          const updated = [newNotif, ...prevNotifs];
          AsyncStorage.setItem("app_notifications", JSON.stringify(updated));
          return updated;
        }
        return prevNotifs;
      });
    });

    return () => subscription.remove();
  }, []);

  const handleNotificationPress = async (notif: any) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notif.id ? { ...n, unread: false } : n
    );
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem("app_notifications", JSON.stringify(updatedNotifications));

    if (notif.data?.type === "practice" && notif.data?.routineId) {
      router.push(`/practice/${notif.data.routineId}`);
    }
  };

  const handleMarkAllRead = async () => {
    const updatedNotifications = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem("app_notifications", JSON.stringify(updatedNotifications));
  };

  const handleClearAll = () => {
    Alert.alert("Clear All", "Are you sure you want to delete all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setNotifications([]);
          await AsyncStorage.removeItem("app_notifications");
        }
      }
    ]);
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* --- HEADER --- */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-surface-light dark:border-gray-800">
          <View className="flex-row items-center">
            <BackButton size={20} className="mr-4" />
            <Text className="text-xl font-bold text-ink dark:text-white">{t("noti")}</Text>
          </View>

          {/* Action Buttons (Mark Read / Clear) */}
          {notifications.length > 0 && (
            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={handleMarkAllRead} className="p-1" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="checkmark-done" size={22} color="#FF9500" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearAll} className="p-1" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* --- NOTIFICATIONS LIST --- */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12 }}>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.7}
                className={`p-4 rounded-3xl flex-row items-start border ${notif.unread
                  ? 'bg-brand/5 border-brand/20 dark:bg-brand/10 dark:border-brand/30'
                  : 'bg-surface border-surface-light dark:bg-[#1A1A1A] dark:border-gray-800'
                  }`}
              >
                {/* Icon */}
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 mt-1 shadow-sm ${notif.unread ? 'bg-white dark:bg-[#2A1E18]' : 'bg-surface-light dark:bg-gray-800'
                  }`}>
                  <Ionicons
                    name={notif.unread ? "notifications" : "notifications-outline"}
                    size={18}
                    color={notif.unread ? "#FF9500" : "gray"}
                  />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text
                      className={`text-sm flex-1 mr-2 ${notif.unread ? 'font-bold text-ink dark:text-white' : 'font-medium text-ink/80 dark:text-gray-400'}`}
                      numberOfLines={1}
                    >
                      {notif.title}
                    </Text>
                    <Text className="text-[10px] text-muted dark:text-gray-500 font-medium">
                      {formatTimeAgo(notif.time)}
                    </Text>
                  </View>
                  <Text className={`text-xs leading-5 ${notif.unread ? 'text-muted dark:text-gray-300' : 'text-muted/70 dark:text-gray-500'}`}>
                    {notif.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            /* --- EMPTY STATE --- */
            <View className="items-center justify-center mt-20">
              <View className="w-20 h-20 rounded-full bg-surface-light dark:bg-gray-800 items-center justify-center mb-4">
                <Ionicons name="notifications-off-outline" size={32} color="gray" style={{ opacity: 0.5 }} />
              </View>
              <Text className="text-ink dark:text-white text-lg font-bold">{t("noti_no")}</Text>
              <Text className="text-muted dark:text-gray-400 mt-2 text-center text-sm">
                {t("noti_no_sub")}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}