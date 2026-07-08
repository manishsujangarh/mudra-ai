import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

interface ProgressWidgetProps {
  topStreak: number;
  totalMinutes: number;
  totalSessions: number;
  consistencyRate: number;
}

export function ProgressWidget({
  topStreak,
  totalMinutes,
  totalSessions,
  consistencyRate,
}: ProgressWidgetProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="mt-8">
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-bold text-ink" numberOfLines={1}>{t("your_progress")}</Text>
        <Pressable
          className="flex-row items-center active:opacity-70"
          onPress={() => router.push("/screens/insights")}
        >
          <Text className="text-[11px] text-brand mr-1">{t("view_insights")}</Text>
          <Ionicons name="arrow-forward" size={12} color="#F97316" />
        </Pressable>
      </View>

      {/* Grid Row */}
      <View className="flex-row bg-surface border border-surface-light rounded-3xl py-4">

        {/* 1. STREAK */}
        <View className="flex-1 items-center border-r border-surface-light px-2">
          <MaterialCommunityIcons name="fire" size={24} color="#F97316" className="mb-2" />
          <Text className="text-xl font-bold text-ink mb-1">{topStreak}</Text>
          <Text className="text-[9px] text-muted uppercase text-center">{t("day_streak")}</Text>
        </View>

        {/* 2. TOTAL MINUTES */}
        {/* <View className="flex-1 items-center border-r border-surface-light px-2">
          <MaterialCommunityIcons name="clock-outline" size={24} color="#22C55E" className="mb-2" />
          <Text className="text-xl font-bold text-ink mb-1">{totalMinutes}</Text>
          <Text className="text-[9px] text-muted uppercase text-center">{t("minutes") || "Minutes"}</Text>
        </View> */}

        {/* 3. TOTAL SESSIONS */}
        <View className="flex-1 items-center border-r border-surface-light px-2">
          <Ionicons name="checkmark-circle-outline" size={24} color="#3B82F6" className="mb-2" />
          <Text className="text-xl font-bold text-ink mb-1">{totalSessions}</Text>
          <Text className="text-[9px] text-muted uppercase text-center">{t("sessions") || "Sessions"}</Text>
        </View>

        {/* 4. CONSISTENCY RATE */}
        <View className="flex-1 items-center px-2">
          <Ionicons name="star-outline" size={24} color="#EAB308" className="mb-2" />
          <Text className="text-xl font-bold text-ink mb-1">{consistencyRate}%</Text>
          <Text className="text-[9px] text-muted uppercase text-center">{t("consistency") || "Consistency"}</Text>
        </View>

      </View>
    </View>
  );
}