import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useActiveRoutines } from "@/hooks/useRoutines";
import { useStats, useMoodInsights, useSessionHistory } from "@/hooks/useSessions";

const MOOD_MAP: Record<string, { icon: string; color: string; label: string }> = {
    stressed: { icon: "emoticon-sad", color: "#EF4444", label: "Stressed" },
    anxious: { icon: "emoticon-neutral", color: "#F97316", label: "Anxious" },
    restless: { icon: "emoticon-dead", color: "#EAB308", label: "Restless" },
    tired: { icon: "sleep", color: "#3B82F6", label: "Tired" },
    distracted: { icon: "emoticon-confused", color: "#9CA3AF", label: "Distracted" },

    calmer: { icon: "emoticon-happy", color: "#84CC16", label: "Calmer" },
    lighter: { icon: "feather", color: "#2DD4BF", label: "Lighter" },
    focused: { icon: "target", color: "#22C55E", label: "Focused" },
    sleepy: { icon: "sleep", color: "#6366F1", label: "Sleepy" },
    same: { icon: "emoticon-neutral", color: "#9CA3AF", label: "Same" },

    unknown: { icon: "help-circle-outline", color: "#CBD5E1", label: "Unknown" }
};

const formatSessionDate = (timestamp: number | string) => {
    if (!timestamp) return "Recently";
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function InsightsScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    const { data: routines = [], isLoading: isRoutinesLoading } = useActiveRoutines();
    const { data: totalSessions = 0, isLoading: isStatsLoading } = useStats();
    const { data: insights, isLoading: isInsightsLoading } = useMoodInsights();

    const { data: recentSessions = [], isLoading: isHistoryLoading } = useSessionHistory();

    const topStreak = routines.reduce((max, r) => Math.max(max, r.streak || 0), 0);
    const totalMinutes = recentSessions.reduce((acc: number, session: any) => acc + (session.duration || 10), 0);
    const consistencyRate = insights?.successRate ? Math.round(insights.successRate * 100) : 0;

    const isLoading = isRoutinesLoading || isStatsLoading || isInsightsLoading || isHistoryLoading;

    return (
        <View className="flex-1 bg-sand pt-14 px-5">

            {/* 🔝 Header */}
            <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center">
                    <Pressable
                        onPress={() => router.back()}
                        className="p-2 mr-3 bg-surface rounded-full border border-surface-light active:opacity-75"
                    >
                        <Ionicons name="arrow-back" size={20} color="#1E293B" />
                    </Pressable>
                    <Text className="text-xl font-black text-ink">{t("my_progress") || "My Progress"}</Text>
                </View>
            </View>

            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#F97316" />
                    <Text className="text-muted mt-3 font-semibold">{t("loading_insights")}</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

                    <Text className="text-sm font-bold text-ink mb-4">{t("lifetime_stats") || "Lifetime Stats"}</Text>

                    <View className="flex-row flex-wrap justify-between mb-6">
                        <View className="bg-surface p-4 rounded-3xl border border-surface-light w-[48%] mb-3">
                            <View className="w-10 h-10 bg-orange-500/10 rounded-2xl items-center justify-center mb-3">
                                <MaterialCommunityIcons name="fire" size={22} color="#F97316" />
                            </View>
                            <Text className="text-2xl font-black text-ink">{topStreak}</Text>
                            <Text className="text-[10px] text-muted uppercase font-bold mt-1">{t("day_streak")}</Text>
                        </View>

                        {/* <View className="bg-surface p-4 rounded-3xl border border-surface-light w-[48%] mb-3">
                            <View className="w-10 h-10 bg-green-500/10 rounded-2xl items-center justify-center mb-3">
                                <MaterialCommunityIcons name="clock-outline" size={22} color="#22C55E" />
                            </View>
                            <Text className="text-2xl font-black text-ink">{totalMinutes}</Text>
                            <Text className="text-[10px] text-muted uppercase font-bold mt-1">{t("total_minutes")}</Text>
                        </View> */}

                        <View className="bg-surface p-4 rounded-3xl border border-surface-light w-[48%]">
                            <View className="w-10 h-10 bg-blue-500/10 rounded-2xl items-center justify-center mb-3">
                                <Ionicons name="checkmark-circle-outline" size={22} color="#3B82F6" />
                            </View>
                            <Text className="text-2xl font-black text-ink">{totalSessions}</Text>
                            <Text className="text-[10px] text-muted uppercase font-bold mt-1">{t("total_sessions")}</Text>
                        </View>

                        <View className="bg-surface p-4 rounded-3xl border border-surface-light w-[48%]">
                            <View className="w-10 h-10 bg-yellow-500/10 rounded-2xl items-center justify-center mb-3">
                                <Ionicons name="star-outline" size={22} color="#EAB308" />
                            </View>
                            <Text className="text-2xl font-black text-ink">{consistencyRate}%</Text>
                            <Text className="text-[10px] text-muted uppercase font-bold mt-1">{t("consistency")}</Text>
                        </View>
                    </View>

                    {/* 🌈 2. MOOD HISTORY SECTION */}
                    <Text className="text-sm font-bold text-ink mb-4 mt-2">{t("mood_history") || "Recent Mood History"}</Text>

                    {recentSessions.length === 0 ? (
                        <View className="bg-surface p-6 rounded-3xl border border-surface-light items-center justify-center mt-2">
                            <MaterialCommunityIcons name="history" size={40} color="#CBD5E1" className="mb-3" />
                            <Text className="text-sm font-bold text-ink mb-1">{t("no_sessions")}</Text>
                            <Text className="text-xs text-muted text-center">{t("no_sessions_sub")}</Text>
                        </View>
                    ) : (
                        recentSessions.map((session: any) => {
                            const preMoodId = session.preMood || session.pre_mood || "unknown";
                            const postMoodId = session.postMood || session.post_mood || "unknown";

                            const pre = MOOD_MAP[preMoodId] || MOOD_MAP.unknown;
                            const post = MOOD_MAP[postMoodId] || MOOD_MAP.unknown;

                            const mudraTitle = session.mudra?.name || session.mudraName || "Mudra Practice";

                            const duration = session.duration || session.routine?.duration || 10;

                            return (
                                <View key={session.id} className="bg-surface p-4 rounded-3xl border border-surface-light mb-3">
                                    <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-surface-light/60">
                                        <View>
                                            <Text className="text-sm font-bold text-ink">{t(mudraTitle)}</Text>
                                            <Text className="text-[10px] text-muted mt-0.5">
                                                {formatSessionDate(session.completedAt || session.createdAt || session.date)}
                                            </Text>
                                        </View>
                                        <View className="bg-surface-light px-3 py-1 rounded-full flex-row items-center">
                                            <MaterialCommunityIcons name="timer-outline" size={12} color="#64748B" className="mr-1" />
                                            <Text className="text-[10px] text-muted font-semibold">{duration} {t("min")}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center justify-between px-2">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: `${pre.color}1A` }}>
                                                <MaterialCommunityIcons name={pre.icon as any} size={16} color={pre.color} />
                                            </View>
                                            <View>
                                                <Text className="text-[9px] text-muted uppercase font-bold">{t("before")}</Text>
                                                <Text className="text-xs font-semibold text-ink" numberOfLines={1}>{t(`mood_${preMoodId}`) || pre.label}</Text>
                                            </View>
                                        </View>

                                        {preMoodId !== "unknown" && postMoodId !== "unknown" && (
                                            <View className="px-2">
                                                <Ionicons name="arrow-forward" size={16} color="#CBD5E1" />
                                            </View>
                                        )}

                                        <View className="flex-row items-center flex-1 justify-end">
                                            <View className="items-end mr-2">
                                                <Text className="text-[9px] text-muted uppercase font-bold">{t("after")}</Text>
                                                <Text className="text-xs font-semibold text-ink" numberOfLines={1}>{t(`mood_${postMoodId}`) || post.label}</Text>
                                            </View>
                                            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: `${post.color}1A` }}>
                                                <MaterialCommunityIcons name={post.icon as any} size={16} color={post.color} />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}

                </ScrollView>
            )}
        </View>
    );
}