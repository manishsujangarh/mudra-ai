import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { usePremiumUnlocked } from "@/components/PremiumLock";

export function BreathingMeditationWidget() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const isPremiumUnlocked = usePremiumUnlocked();

    const handlePress = () => {
        if (isPremiumUnlocked) {
            router.push("/screens/BreathingMeditation");
        } else {
            router.push("/premium");
        }
    };

    const bgColor = isDark ? "#1C1C1E" : "#F8F5F0";
    const borderColor = isDark ? "#2C2C2E" : "#E8E4DC";
    const iconBg = isDark ? "#2A1A0A" : "#FEF3E7";

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            className="mx-5 mt-6 rounded-2xl overflow-hidden"
            style={{
                backgroundColor: bgColor,
                borderWidth: 1,
                borderColor: borderColor,
            }}
        >
            {/* Gradient-like top accent */}
            <View className="h-1 bg-brand" />

            <View className="p-5">
                {/* Top row: icon + premium badge */}
                <View className="flex-row items-start justify-between mb-3">
                    {/* Icon circle */}
                    <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: iconBg }}
                    >
                        <MaterialCommunityIcons
                            name="meditation"
                            size={24}
                            color="#FF9500"
                        />
                    </View>

                    {/* Premium badge / lock chip */}
                    {isPremiumUnlocked === false && (
                        <View className="flex-row items-center bg-brand/15 border border-brand/30 rounded-full px-3 py-1.5">
                            <Ionicons name="lock-closed" size={11} color="#FF9500" />
                            <Text className="text-brand text-[10px] font-bold ml-1.5 uppercase tracking-wider">
                                {t("premium") || "Premium"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Title */}
                <Text className="text-base font-bold text-ink dark:text-[#F6F1EC] mb-1.5">
                    {t("breathing_meditation") || "Breathing & Meditation"}
                </Text>

                {/* Description */}
                <Text className="text-sm text-muted dark:text-gray-400 leading-5 mb-4">
                    Guided breathing exercises, meditation timer, and daily practice reminders to calm your mind.
                </Text>

                {/* Bottom row: feature chips + arrow */}
                <View className="flex-row items-center justify-between">
                    {/* Feature mini-chips */}
                    <View className="flex-row gap-2">
                        <View className="flex-row items-center bg-surface-light dark:bg-zinc-800 rounded-full px-2.5 py-1">
                            <Ionicons name="timer-outline" size={12} color="#FF9500" />
                            <Text className="text-[10px] text-muted dark:text-gray-400 ml-1 font-medium">
                                {t("breathing") || "Breathing"}
                            </Text>
                        </View>
                        <View className="flex-row items-center bg-surface-light dark:bg-zinc-800 rounded-full px-2.5 py-1">
                            <Ionicons name="alarm-outline" size={12} color="#FF9500" />
                            <Text className="text-[10px] text-muted dark:text-gray-400 ml-1 font-medium">
                                {t("schedule") || "Schedule"}
                            </Text>
                        </View>
                    </View>

                    {/* Arrow */}
                    <View className="w-8 h-8 rounded-full bg-brand/10 items-center justify-center">
                        <Ionicons name="arrow-forward" size={16} color="#FF9500" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}