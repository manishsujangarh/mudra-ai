import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Trans, useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

// static डेटा जो आपके PRE_MOODS और POST_MOODS दोनों को कवर करता है
const STATIC_MOOD_FACES = [
    { id: "stressed", label: "mood_stressed", icon: "emoticon-sad", color: "#EF4444" },
    { id: "anxious", label: "mood_anxious", icon: "emoticon-neutral", color: "#F97316" },
    { id: "tired", label: "mood_tired", icon: "sleep", color: "#3B82F6" },
    { id: "calmer", label: "mood_calmer", icon: "emoticon-happy", color: "#84CC16" },
    { id: "focused", label: "mood_focused", icon: "emoticon-excited", color: "#22C55E" },
];

interface MoodTrackingWidgetProps {
    insights: {
        successRate: number;
        mostFrequentMood: string;
        totalAnalyzed: number;
    } | null | undefined;
}

export function MoodTrackingWidget({ insights }: MoodTrackingWidgetProps) {
    const { t } = useTranslation();
    const router = useRouter();

    const activeMood = insights?.mostFrequentMood || null;
    const successPercentage = insights?.successRate ? Math.round(insights.successRate * 100) : 0;

    return (
        <View className="mt-8">
            {/* Header Row */}
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-ink" numberOfLines={1}>{t("mood_tracking")}</Text>
                <Pressable
                    className="flex-row items-center active:opacity-70"
                    onPress={() => router.push("/screens/insights")}
                >
                    <Text className="text-[11px] text-brand mr-1">{t("view_history")}</Text>
                    <Ionicons name="arrow-forward" size={12} color="#F97316" />
                </Pressable>
            </View>

            {/* Main Widget Card */}
            <View className="bg-surface border border-surface-light rounded-3xl p-5 relative overflow-hidden">

                {insights && insights.totalAnalyzed > 0 ? (
                    <View className="mb-4 bg-brand/5 border border-brand/10 p-3 rounded-2xl flex-row justify-between items-center">
                        <Text className="text-xs text-ink font-medium">
                            <Trans
                                i18nKey="mood_improvement"
                                values={{ percentage: successPercentage }}
                                components={{
                                    brand: <Text className="text-brand font-bold" />
                                }}
                            />
                        </Text>
                        <Text className="text-[10px] text-muted">
                            {t("based_on_entries", { count: insights.totalAnalyzed })}
                        </Text>
                    </View>
                ) : null}

                <View className="flex-row justify-between">
                    {/* 1. BEFORE PRACTICE */}
                    <View className="flex-1 items-center">
                        <Text className="text-xs font-bold text-ink mb-1" numberOfLines={1}>{t("before_practice")}</Text>
                        <Text className="text-[10px] text-muted mb-4">{t("how_feel_before")}</Text>
                        <View className="flex-row justify-between w-full px-1">
                            {STATIC_MOOD_FACES.slice(0, 3).map((face) => {
                                const isSelected = activeMood === face.id;
                                return (
                                    <View
                                        key={`pre-${face.id}`}
                                        className={`items-center p-1 rounded-xl ${isSelected ? "bg-brand/10 border border-brand/20 scale-110" : "opacity-40"
                                            }`}
                                    >
                                        <MaterialCommunityIcons name={face.icon as any} size={20} color={face.color} className="mb-1" />
                                        <Text className={`text-[8px] text-center ${isSelected ? "font-bold text-ink" : "text-muted"}`}>
                                            {t(face.label).replace(" ", "\n")}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Middle Arrow Separator */}
                    <View className="justify-center px-2 pt-6">
                        <View className="w-5 h-5 rounded-full bg-surface-light items-center justify-center border border-surface">
                            <Ionicons name="arrow-forward" size={10} color="gray" />
                        </View>
                    </View>

                    {/* 2. AFTER PRACTICE */}
                    <View className="flex-1 items-center">
                        <Text className="text-xs font-bold text-ink mb-1" numberOfLines={1}>{t("after_practice")}</Text>
                        <Text className="text-[10px] text-muted mb-4">{t("how_feel_now")}</Text>
                        <View className="flex-row justify-between w-full px-1">
                            {STATIC_MOOD_FACES.slice(3).map((face) => {
                                const isSelected = activeMood === face.id;
                                return (
                                    <View
                                        key={`post-${face.id}`}
                                        className={`items-center p-1 rounded-xl ${isSelected ? "bg-brand/10 border border-brand/20 scale-110" : "opacity-40"
                                            }`}
                                    >
                                        <MaterialCommunityIcons name={face.icon as any} size={20} color={face.color} className="mb-1" />
                                        <Text className={`text-[8px] text-center ${isSelected ? "font-bold text-ink" : "text-muted"}`}>
                                            {t(face.label).replace(" ", "\n")}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Bottom Privacy Note Footer */}
                <View className="mt-5 pt-3 border-t border-surface-light flex-row items-center justify-center">
                    <Ionicons name="lock-closed-outline" size={10} color="gray" className="mr-1.5" />
                    <Text className="text-[9px] text-muted">{t("tracking_privacy_note")}</Text>
                </View>
            </View>
        </View>
    );
}