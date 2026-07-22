import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { LoadingScreen } from "@/components/ui";
import { useCreateRoutine } from "@/hooks/useRoutines";
import { usePreferences } from "@/hooks/usePreferences";
import { clamp } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { getMudraImage } from "@/utils/images";
7
// 🕒 क्विक टाइम सिलेक्शन के लिए ऑप्शंस (24-hour format)
const QUICK_TIMES = [
  { id: "06:00", label: "6:00 AM", icon: "white-balance-sunny" },
  { id: "07:30", label: "7:30 AM", icon: "white-balance-sunny" },
  { id: "12:30", label: "12:30 PM", icon: "white-balance-sunny" },
  { id: "18:00", label: "6:00 PM", icon: "weather-sunset" },
  { id: "19:30", label: "7:30 PM", icon: "moon-waning-crescent" },
  { id: "21:00", label: "9:00 PM", icon: "moon-waning-crescent" },
];

export default function RoutineBuilder() {
  const router = useRouter();
  const { t } = useTranslation();
  const rec = useAppStore((s) => s.pendingRecommendation);
  const setPendingRecommendation = useAppStore((s) => s.setPendingRecommendation);

  const { data: prefs } = usePreferences();
  const create = useCreateRoutine();

  const [time, setTime] = useState(prefs?.preferredTime ?? "07:30");
  const [duration, setDuration] = useState(rec?.suggestedDuration || 2);

  if (!rec) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-[#0A0A0A]">
        <Text className="text-slate-500 dark:text-gray-400">{t("no_schedule")}</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-6 py-3 bg-brand rounded-full active:opacity-80">
          <Text className="font-bold text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const [hourStr, minStr] = time.split(":");
  let currentHour = parseInt(hourStr, 10);
  let currentMin = parseInt(minStr, 10);

  const adjustHour = (delta: number) => {
    let newHour = (currentHour + delta + 24) % 24;
    setTime(`${newHour.toString().padStart(2, '0')}:${minStr}`);
  };

  const adjustMin = (delta: number) => {
    let newMin = (currentMin + delta + 60) % 60;
    setTime(`${hourStr.padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`);
  };

  const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const amPm = currentHour >= 12 ? "PM" : "AM";
  const displayTime = `${displayHour}:${minStr.padStart(2, '0')} ${amPm}`;

  const onCreate = async () => {
    await create.mutateAsync({
      mudraId: rec.mudra.id,
      mudraName: rec.mudra.name,
      reminderTime: time,
      duration: clamp(duration, 1, 60),
    });
    setPendingRecommendation(null);
    router.replace("/(tabs)/routines");
  };

  const imageSource = getMudraImage(rec.mudra.imageUrl);
  const mainBenefit = rec.mudra.benefits?.[0] || "Balances mind and body";

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#0A0A0A]" edges={['bottom', 'top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 🔝 Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-70">
            <Ionicons name="arrow-back" size={24} color={Platform.OS === 'ios' ? '#000' : 'gray'} className="dark:color-white" />
          </Pressable>
          <Text className="text-lg font-bold text-slate-900 dark:text-white ml-2" numberOfLines={1}>
            {t("build_routine") || "Build Routine"}
          </Text>
        </View>
        <Pressable className="p-2 active:opacity-70">
          <Ionicons name="settings-outline" size={22} color="gray" className="dark:color-white" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* 🌟 Top Mudra Info Card */}
        <View className="flex-row items-center mt-4 mb-5">
          <View className="w-20 h-20 rounded-full items-center justify-center mr-4 border border-brand/40 bg-slate-100 dark:bg-[#1A1A1A] relative">
            <View className="absolute w-24 h-24 rounded-full bg-brand/10 blur-xl" />
            <Image
              source={imageSource ?? undefined}
              contentFit="contain"
              style={{ width: 50, height: 50 }}
            />
          </View>

          <View className="flex-1 ml-2">
            <Text className="text-xs text-slate-500 dark:text-gray-400 mb-0.5">
              {t("building") || "Building a routine for"}
            </Text>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {t(rec.mudra.name)}
            </Text>
            <Text className="text-[10px] text-slate-500 dark:text-gray-400 leading-tight">
              {rec.reason || t("selected_from_library") || "Selected from the mudra library."}
            </Text>
          </View>
        </View>

        {/* 🍃 Benefit Pill */}
        <View className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 rounded-2xl p-3 flex-row items-center justify-between mb-8">
          <View className="flex-row items-center flex-1 pr-2">
            <View className="flex-1">
              <Text className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                {t("benefit") || "Benefit"}
              </Text>
              <Text className="text-xs font-semibold text-slate-900 dark:text-white" numberOfLines={2}>
                {t(mainBenefit)}
              </Text>
            </View>
          </View>
        </View>

        {/* ⏰ TIME SELECTION */}
        <Text className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          {t("what_practice") || "WHAT TIME DO YOU WANT TO PRACTICE?"}
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {QUICK_TIMES.map((qt) => {
            const isActive = time === qt.id;
            return (
              <Pressable
                key={qt.id}
                onPress={() => setTime(qt.id)}
                className={`flex-row items-center px-3 py-2 rounded-full border transition-colors ${isActive
                  ? 'bg-brand border-brand'
                  : 'bg-white dark:bg-[#1A1A1A] border-slate-200 dark:border-gray-800'
                  }`}
              >
                <MaterialCommunityIcons name={qt.icon as any} size={14} color={isActive ? "white" : "#FF9500"} />
                <Text className={`ml-1.5 text-xs font-medium ${isActive ? 'text-white' : 'text-slate-700 dark:text-gray-300'}`}>
                  {qt.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Custom Stepper */}
        <View className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 rounded-3xl p-5 flex-row items-center justify-between mb-8">
          <View className="bg-slate-50 dark:bg-[#262626] rounded-2xl p-2 items-center w-[70px]">
            <Pressable onPress={() => adjustHour(1)} className="p-2 active:opacity-50">
              <Text className="text-brand text-lg font-bold">+</Text>
            </Pressable>
            <Text className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase my-1">{t("hour")}</Text>
            <Pressable onPress={() => adjustHour(-1)} className="p-2 active:opacity-50">
              <Text className="text-brand text-lg font-bold">−</Text>
            </Pressable>
          </View>

          <View className="items-center flex-1">
            <MaterialCommunityIcons name="clock-outline" size={16} color="#FF9500" className="mb-1" />
            <Text className="text-4xl font-black text-slate-900 dark:text-white mb-1">
              {displayTime}
            </Text>
            <View className="flex-row items-center">
              {/* 🔥 FIXED ICON HERE (Used star-four-points instead of sparkles) */}
              <MaterialCommunityIcons name="star-four-points" size={12} color="#FF9500" />
              <Text className="text-[9px] text-slate-500 dark:text-gray-400 ml-1">
                {t("recommended_beginners") || "Recommended for beginners"}
              </Text>
            </View>
          </View>

          <View className="bg-slate-50 dark:bg-[#262626] rounded-2xl p-2 items-center w-[70px]">
            <Pressable onPress={() => adjustMin(5)} className="p-2 active:opacity-50">
              <Text className="text-brand text-lg font-bold">+</Text>
            </Pressable>
            <Text className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase my-1">{t("min")}</Text>
            <Pressable onPress={() => adjustMin(-5)} className="p-2 active:opacity-50">
              <Text className="text-brand text-lg font-bold">−</Text>
            </Pressable>
          </View>
        </View>

        {/* ⏳ SESSION LENGTH */}
        <Text className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          {t("session_length") || "SESSION LENGTH"}
        </Text>

        <View className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 rounded-3xl p-4 flex-row items-center justify-between mb-8">
          <Pressable
            onPress={() => setDuration((d) => clamp(d - 1, 1, 60))}
            className="w-14 h-12 bg-slate-50 dark:bg-[#262626] rounded-2xl items-center justify-center active:opacity-70"
          >
            <Text className="text-brand text-xl px-4 font-bold">−</Text>
          </Pressable>

          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <MaterialCommunityIcons name="clock-outline" size={14} color="#64748B" className="mr-1" />
              <Text className="text-2xl font-black text-slate-900 dark:text-white ml-1">
                {duration} <Text className="text-lg font-bold">{t("min")}</Text>
              </Text>
            </View>
            <Text className="text-[10px] text-brand font-medium">
              {duration <= 5 ? (t("beginner_friendly") || "Beginner Friendly") : (t("advanced") || "Advanced")}
            </Text>
          </View>

          <Pressable
            onPress={() => setDuration((d) => clamp(d + 1, 1, 60))}
            className="w-14 h-12 bg-slate-50 dark:bg-[#262626] rounded-2xl items-center justify-center active:opacity-70"
          >
            <Text className="text-brand text-xl px-4 font-bold">+</Text>
          </Pressable>
        </View>

        {/* 🔘 CREATE BUTTON */}
        <Pressable
          onPress={onCreate}
          disabled={create.isPending}
          className="bg-brand rounded-2xl flex-row items-center justify-center py-4 mb-4 active:opacity-80"
        >
          <MaterialCommunityIcons name="calendar-check" size={20} color="white" className="mr-2" />
          <Text className="text-white font-bold text-base">
            {create.isPending ? t("saving") || "Saving..." : t("daily_routine") || "Create Daily Routine"}
          </Text>
        </Pressable>

        {/* 🔔 FOOTER ALERT */}
        <View className="bg-slate-100 dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 rounded-2xl p-4 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-brand/10 items-center justify-center mr-3">
            <Ionicons name="notifications" size={18} color="#FF9500" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
              {t("daily_routine_sub") || "We'll remind you every day at this time"}
            </Text>
            <Text className="text-[10px] text-slate-500 dark:text-gray-400 leading-tight">
              {t("change_pause_anytime") || "You can change or pause reminders anytime."}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
