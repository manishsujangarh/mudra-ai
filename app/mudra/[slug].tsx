import React from "react";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { LoadingScreen } from "@/components/ui";
import { useMudraBySlug } from "@/hooks/useMudras";
import { useAppStore } from "@/store/useAppStore";
import { getMudraImage } from "@/utils/images";
import { AdBanner } from "@/ads/AdBanner";
import { BackButton } from "@/components/BackButton";

export default function MudraDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: mudra, isLoading } = useMudraBySlug(slug);
  const setPendingRecommendation = useAppStore((s) => s.setPendingRecommendation);

  if (isLoading) return <LoadingScreen />;

  if (!mudra) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-[#0A0A0A]">
        <Text className="text-slate-500 dark:text-gray-400">{t("mudra_not_found")}</Text>
      </View>
    );
  }

  const buildRoutine = () => {
    setPendingRecommendation({
      mudra,
      reason: t("selected_library"),
      suggestedDuration: mudra.duration,
      score: 0,
    });
    router.push("/routine-builder");
  };

  const startPracticeNow = () => {
    // यहाँ आप सीधे प्रैक्टिस स्क्रीन पर भेजने का लॉजिक लगा सकते हैं
    buildRoutine();
  };

  const imageSource = getMudraImage(mudra.imageUrl);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#0A0A0A]" edges={['bottom', 'top']}>
      {/* 🔝 Custom Header (Hidden Native Header) */}
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <View className="flex-row items-center">
          <BackButton size={24} className="mr-2" />
          <Text className="text-lg font-bold text-slate-900 dark:text-white">
            {t(mudra.name)}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* 🌟 Top Hero Section (Split Layout) */}
        <View className="flex-row px-5 mt-4 mb-6">
          {/* Left Content */}
          <View className="flex-1 pr-4 justify-center">
            <Text className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {t(mudra.name)}
            </Text>

            <View className="self-start px-2 py-1 bg-brand/10 border border-brand/20 rounded-md mb-3">
              <Text className="text-[10px] font-bold text-brand uppercase tracking-widest">
                {t(mudra.category)}
              </Text>
            </View>

            <Text className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed mb-4">
              {t(mudra.description)}
            </Text>

            <View className="flex-row items-center">
              <MaterialCommunityIcons name="clock-outline" size={14} color="#FF9500" />
              <Text className="text-xs font-medium text-slate-600 dark:text-gray-300 ml-1 mr-4">
                {mudra.duration} {t("min")}
              </Text>

              <MaterialCommunityIcons name="chart-bar" size={14} color="#FF9500" />
              <Text className="text-xs font-medium text-slate-600 dark:text-gray-300 ml-1">
                {t("beginner_friendly") || "Beginner Friendly"}
              </Text>
            </View>
          </View>

          {/* Right Image */}
          <View className="w-[140px] h-[160px] bg-slate-100 dark:bg-[#1A1A1A] rounded-3xl items-center justify-center border border-slate-200 dark:border-gray-800 overflow-hidden">
            <View className="absolute w-24 h-24 rounded-full border border-brand/30" />
            <Image
              source={imageSource ?? undefined}
              contentFit="contain"
              style={{ width: 110, height: 110 }}
            />
          </View>
        </View>

        {/* 🍃 Benefits Section */}
        {mudra.benefits.length > 0 && (
          <View className="px-5 mb-4">
            <View className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 rounded-3xl p-5">
              <View className="flex-row items-center mb-5">
                <MaterialCommunityIcons name="leaf" size={18} color="#FF9500" />
                <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
                  {t("benefits")}
                </Text>
              </View>

              {mudra.benefits.map((b, i) => (
                <View key={i} className="mb-3 flex-row items-start pr-2">
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FF9500" className="mt-0.5 mr-3" />
                  <Text className="flex-1 text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                    {t(b)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 🧘‍♂️ How to Practice Section */}
        {mudra.instructions.length > 0 && (
          <View className="px-5 mb-6">
            <View className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 rounded-3xl p-5">
              <View className="flex-row items-center mb-5">
                <MaterialCommunityIcons name="flower-tulip" size={18} color="#FF9500" />
                <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
                  {t("how_practice")}
                </Text>
              </View>

              <View className="w-full">
                {/* Steps Timeline Wrapper */}
                {mudra.instructions.map((step, i) => (
                  <View key={i} className="flex-row">

                    {/* Left Timeline Indicator (Number + Line) */}
                    <View className="items-center mr-3 w-6">
                      {/* Circle Number */}
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-brand/10 border border-brand/20">
                        <Text className="text-[10px] font-bold text-brand">{i + 1}</Text>
                      </View>
                    </View>

                    <View className="flex-1 pb-3 justify-start">
                      <Text className="text-sm leading-6 text-slate-600 dark:text-gray-300">
                        {t(step)}
                      </Text>
                    </View>

                  </View>
                ))}
              </View>

            </View>
          </View>
        )}
        <View className="px-5 mb-5">
          <AdBanner />
        </View>

      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] border-t border-slate-200 dark:border-gray-800 p-5 pb-8">

        <Pressable onPress={() => router.push(`/verify-mudra/${mudra.id}`)}
          className="bg-brand/10 rounded-2xl flex-row items-center justify-center py-4 mb-3 active:opacity-80 shadow-sm"
        >
          <Ionicons className="mr-2 dark:text-white text-black" color="white" name="scan-outline" size={18} />
          <Text className="text-black dark:text-white font-bold text-sm" numberOfLines={1}>
            {t("Test Posture with AI")}
          </Text>
        </Pressable>

        <Pressable className="bg-brand/10 border border-brand/20 rounded-2xl flex-row items-center justify-center py-4 active:opacity-80" onPress={buildRoutine}>
          <MaterialCommunityIcons className="mr-2" color="#F97316" name="calendar-plus" size={18} />
          <Text className="text-brand font-bold text-sm" numberOfLines={1}>
            {t("add_daily") || "Add to Daily Routine"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
