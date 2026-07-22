import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { useAppStore, PlanData } from "@/store/useAppStore";
import { BackButton } from "@/components/BackButton";

const AVAILABLE_PLANS: PlanData[] = [
    {
        id: "sleep_7_days",
        titleKey: "7 Days to Better Sleep",
        totalDays: 7,
        currentDay: 1,
        icon: "moon-waning-crescent",
        color: "#6366F1",
        mudrasPerDay: ["1", "2", "3", "4", "5", "6", "7"]
    },
    {
        id: "anxiety_14_days",
        titleKey: "14 Days Anxiety Relief",
        totalDays: 14,
        currentDay: 1,
        icon: "heart-flash",
        color: "#EF4444",
        mudrasPerDay: ["1", "3", "5", "2", "4", "6", "7", "1", "3", "5", "2", "4", "6", "7"]
    },
    {
        id: "focus_21_days",
        titleKey: "21 Days Mind Focus",
        totalDays: 21,
        currentDay: 1,
        icon: "brain",
        color: "#22C55E",
        mudrasPerDay: ["2", "4", "1", "3", "5", "7", "6", "2", "4", "1", "3", "5", "7", "6", "2", "4", "1", "3", "5", "7", "6"]
    }
];

export default function PlansScreen() {
    const { t } = useTranslation();

    const activePlans = useAppStore((s) => s.activePlans) || [];
    const togglePlanActivation = useAppStore((s) => s.togglePlanActivation);

    return (
        <View className="flex-1 bg-sand pt-14 px-5">

            {/* 🔝 Header Row */}
            <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center">
                    <BackButton size={20} className="mr-3" />
                    <Text className="text-xl font-black text-ink">{t("explore_plans") || "Wellness Challenges"}</Text>
                </View>
            </View>

            <Text className="text-xs text-muted mb-6 leading-5">
                {t("plans_subtitle") || "Activate challenges to cultivate mental consistency. You can practice multiple plans at your own pace."}
            </Text>

            {/* 📜 Cards List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {AVAILABLE_PLANS.map((plan) => {
                    const isCurrentActive = activePlans.some((p) => p.id === plan.id);

                    return (
                        <View
                            key={plan.id}
                            // 🔥 FIX: Removed 'transition-all' and 'scale-[1.01]' to prevent Reanimated crashes
                            className={`bg-surface p-5 relative rounded-3xl mb-4 border ${isCurrentActive ? "border-brand bg-brand/5" : "border-surface-light"
                                }`}
                        >
                            {/* Active Badge */}
                            {isCurrentActive && (
                                <View className="absolute rounded-3xl mt-2 top-0 right-1 bg-brand px-3 py-1 flex-row items-center">
                                    <Ionicons name="checkmark-circle" size={11} color="white" className="mr-1" />
                                    <Text className="text-[9px] text-white font-bold uppercase tracking-wider">Active</Text>
                                </View>
                            )}

                            <View className="flex-row items-start">
                                <View
                                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4 border"
                                    style={{ backgroundColor: `${plan.color}1A`, borderColor: `${plan.color}33` }}
                                >
                                    <MaterialCommunityIcons name={plan.icon as any} size={24} color={plan.color} />
                                </View>

                                <View className="flex-1 pr-4">
                                    <Text className="text-base font-bold text-ink mb-1">{t(plan.titleKey)}</Text>
                                    <View className="flex-row items-center mb-2">
                                        <MaterialCommunityIcons name="clock-outline" size={12} color="#64748B" className="mr-1" />
                                        <Text className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                                            {plan.totalDays} {t("days_challenge") || "Days Challenge"}
                                        </Text>
                                    </View>
                                    <Text className="text-xs text-muted leading-relaxed">
                                        {t(`${plan.id}_desc`) || "Build a powerful daily routine and experience structural mindfulness through specific element hand gestures."}
                                    </Text>
                                </View>
                            </View>

                            <View className="mt-5 pt-3 border-t border-surface-light/60 flex-row justify-end items-center">
                                <Pressable
                                    onPress={() => togglePlanActivation(plan)}
                                    className="px-5 py-2.5 rounded-full active:opacity-80 border"
                                    style={{
                                        backgroundColor: isCurrentActive ? "#F1F5F9" : plan.color,
                                        borderColor: isCurrentActive ? "#CBD5E1" : plan.color
                                    }}
                                >
                                    <Text
                                        className="font-bold p-2 text-xs"
                                        style={{ color: isCurrentActive ? "#475569" : "#FFFFFF" }}
                                    >
                                        {isCurrentActive ? "Deactivate" : "Activate Plan"}
                                    </Text>
                                </Pressable>
                            </View>

                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}