import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Trans, useTranslation } from "react-i18next";

const STATIC_MOOD_FACES = [
    { id: "stressed", label: "mood_stressed", icon: "emoticon-sad-outline", color: "#EF4444" },
    { id: "anxious", label: "mood_anxious", icon: "emoticon-neutral-outline", color: "#FF9500" },
    { id: "tired", label: "mood_tired", icon: "sleep", color: "#3B82F6" },
    { id: "calmer", label: "mood_calmer", icon: "emoticon-happy-outline", color: "#84CC16" },
    { id: "focused", label: "mood_focused", icon: "emoticon-excited-outline", color: "#22C55E" },
] as const;

interface MoodTrackingWidgetProps {
    insights?: {
        successRate?: number;
        mostFrequentMood?: string;
        totalAnalyzed?: number;
    } | null;
    onViewHistory: () => void;
}

export function MoodTrackingWidget({ insights, onViewHistory }: MoodTrackingWidgetProps) {
    const { t } = useTranslation();

    const activeMood = insights?.mostFrequentMood ?? null;
    const totalAnalyzed = insights?.totalAnalyzed ?? 0;
    const successPercentage = insights?.successRate ? Math.round(insights.successRate) : 0;

    const renderMoodFace = (face: typeof STATIC_MOOD_FACES[number], keyPrefix: string) => {
        const isSelected = activeMood === face.id;
        const translatedLabel = String(t(face.label) || "");

        return (
            <View
                key={`${keyPrefix}-${face.id}`}
                className={`flex-1 items-center justify-center p-1.5 rounded-xl border ${isSelected
                    ? "bg-brand/10 border-brand/30"
                    : "border-transparent opacity-50"
                    }`}
            >
                <MaterialCommunityIcons
                    name={face.icon as any}
                    size={22}
                    color={face.color}
                />
                <Text
                    className={`text-[9px] text-center mt-1 ${isSelected ? "font-bold text-ink" : "text-muted"
                        }`}
                    numberOfLines={2}
                >
                    {translatedLabel}
                </Text>
            </View>
        );
    };

    return (
        <View className="mt-6">
            {/* Header Row */}
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                    {t("mood_tracking")}
                </Text>
                <Pressable
                    className="flex-row items-center active:opacity-70 py-1 px-2"
                    onPress={onViewHistory}
                    hitSlop={8}
                >
                    <Text className="text-xs font-medium text-brand mr-1">
                        {t("view_history")}
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color="#FF9500" />
                </Pressable>
            </View>

            {/* Main Widget Card */}
            <View className="bg-surface border border-surface-light rounded-[24px] p-4 relative overflow-hidden">
                {totalAnalyzed > 0 && (
                    <View className="mb-4 bg-brand/10 border border-brand/10 p-3 rounded-xl flex-row justify-between items-center">
                        <Text className="text-xs text-ink font-medium flex-1 mr-2">
                            <Trans
                                i18nKey="mood_improvement"
                                values={{ percentage: successPercentage }}
                                components={{
                                    brand: <Text className="text-brand font-bold" />
                                }}
                            />
                        </Text>
                        <Text className="text-[10px] text-muted">
                            {t("based_on_entries", { count: totalAnalyzed })}
                        </Text>
                    </View>
                )}

                <View className="flex-row items-start justify-between gap-1">
                    {/* 1. BEFORE PRACTICE */}
                    <View className="flex-1 items-center">
                        <Text className="text-xs font-bold text-ink mb-0.5 text-center" numberOfLines={1}>
                            {t("before_practice")}
                        </Text>
                        <Text className="text-[10px] text-muted mb-3 text-center" numberOfLines={1}>
                            {t("how_feel_before")}
                        </Text>
                        <View className="flex-row justify-around w-full gap-1">
                            {STATIC_MOOD_FACES.slice(0, 3).map((face) => renderMoodFace(face, "pre"))}
                        </View>
                    </View>

                    {/* Middle Arrow Separator */}
                    <View className="justify-center items-center pt-8 px-1">
                        <View className="w-6 h-6 rounded-full bg-surface-light items-center justify-center border border-surface-light">
                            <Ionicons name="arrow-forward" size={12} color="gray" />
                        </View>
                    </View>

                    {/* 2. AFTER PRACTICE */}
                    <View className="flex-1 items-center">
                        <Text className="text-xs font-bold text-ink mb-0.5 text-center" numberOfLines={1}>
                            {t("after_practice")}
                        </Text>
                        <Text className="text-[10px] text-muted mb-3 text-center" numberOfLines={1}>
                            {t("how_feel_now")}
                        </Text>
                        <View className="flex-row justify-around w-full gap-1">
                            {STATIC_MOOD_FACES.slice(3).map((face) => renderMoodFace(face, "post"))}
                        </View>
                    </View>
                </View>

                {/* Bottom Privacy Note Footer */}
                <View className="mt-4 pt-3 border-t border-surface-light flex-row items-center justify-center">
                    <Ionicons name="lock-closed-outline" size={11} color="gray" style={{ marginRight: 4 }} />
                    <Text className="text-[10px] text-muted">{t("tracking_privacy_note")}</Text>
                </View>
            </View>
        </View>
    );
}