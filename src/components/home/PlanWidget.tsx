import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { PlanData } from "@/store/useAppStore";

interface PlanWidgetProps {
    activePlans: PlanData[];
    onContinuePlan: (plan: PlanData) => void;
}

export function PlanWidget({ activePlans, onContinuePlan }: PlanWidgetProps) {
    const { t } = useTranslation();
    const router = useRouter();

    // 🗺️ रूट पाथ को एक जगह सेट कर दिया ताकि मिसमैच न हो
    const PLANS_ROUTE = "/screens/PlansScreen";

    return (
        <View className="mt-8">
            {/* Header Row */}
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-ink" numberOfLines={1}>{t("active_challenges") || "Active Challenges"}</Text>
                <Pressable
                    className="flex-row items-center active:opacity-70"
                    onPress={() => router.push(PLANS_ROUTE)}
                >
                    <Text className="text-[11px] text-brand mr-1">{t("see_all") || "See All"}</Text>
                    <Ionicons name="arrow-forward" size={12} color="#F97316" />
                </Pressable>
            </View>

            {/* Empty State */}
            {activePlans.length === 0 ? (
                <View className="bg-surface p-4 rounded-3xl border border-surface-light flex-row items-center justify-between">
                    <Text className="text-sm text-muted flex-1">
                        {t("no_active_plan_msg") || "No challenges active. Start one to build consistency!"}
                    </Text>
                    <Pressable
                        onPress={() => router.push(PLANS_ROUTE)}
                        className="bg-brand px-4 py-2 rounded-full active:opacity-80"
                    >
                        <Text className="text-white font-bold text-[11px]">Explore</Text>
                    </Pressable>
                </View>
            ) : (
                /* Active Plans List */
                activePlans.map((plan) => {
                    // प्रोग्रेस बार की गणना प्रतिशत में
                    const progressPercentage = Math.min((plan.currentDay / plan.totalDays) * 100, 100);

                    return (
                        <View
                            key={plan.id}
                            className="bg-surface p-4 rounded-3xl border border-surface-light flex-row items-center mb-3"
                        >
                            {/* Icon Wrapper with Dynamic Glassmorphism alpha tint */}
                            <View
                                className="w-12 h-12 rounded-2xl items-center justify-center mr-4 border"
                                style={{ backgroundColor: `${plan.color}1A`, borderColor: `${plan.color}33` }}
                            >
                                <MaterialCommunityIcons name={plan.icon as any} size={24} color={plan.color} />
                            </View>

                            {/* Plan Info & Progress */}
                            <View className="flex-1">
                                <Text className="text-sm font-bold text-ink mb-1">{t(plan.titleKey)}</Text>
                                <Text className="text-[10px] text-muted mb-2">
                                    {t("day_of_total", { current: plan.currentDay, total: plan.totalDays })}
                                </Text>

                                {/* Progress Bar Track */}
                                <View className="h-1 bg-surface-light rounded-full w-full overflow-hidden">
                                    <View
                                        className="h-full rounded-full"
                                        style={{ width: `${progressPercentage}%`, backgroundColor: plan.color }}
                                    />
                                </View>
                            </View>

                            {/* Continue Button */}
                            <Pressable
                                onPress={() => onContinuePlan(plan)}
                                className="ml-4 bg-surface-light px-4 py-2 rounded-full border border-surface-light active:opacity-70"
                            >
                                <Text className="font-medium text-[11px]" style={{ color: plan.color }}>
                                    {t("continue")}
                                </Text>
                            </Pressable>
                        </View>
                    );
                })
            )}
        </View>
    );
}