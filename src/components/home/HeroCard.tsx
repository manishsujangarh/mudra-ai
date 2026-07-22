import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { getMudraImage } from "@/utils/images";

interface HeroCardProps {
    mudra: {
        id: string;
        name: string;
        description: string;
        imageUrl: string | null;
        duration?: number;
        best_time?: string;
        tag?: string;
    } | null;

    isLoading?: boolean;
    isSaved?: boolean;

    onStartPractice: (mudraId: string, name: string, duration: number) => void;
    onSaveMudra: (mudraId: string) => void;
}

export function HeroCard({
    mudra,
    isLoading = false,
    isSaved = false,
    onStartPractice,
    onSaveMudra
}: HeroCardProps) {
    const { t } = useTranslation();

    if (!mudra) return null;

    const displayNameKey = mudra.name;
    const displayDescKey = mudra.description;
    const displayImage = getMudraImage(mudra.imageUrl);

    const displayDuration = mudra.duration || 10;
    const displayBestTime = mudra.best_time || "before_bed";
    const displayTag = mudra.tag || "best_for_sleep";

    return (
        <View className="mt-6 overflow-hidden rounded-[28px] border border-surface-light bg-surface relative min-h-[220px]">

            <View className="absolute -top-10 right-[-40px] w-[220px] h-full opacity-80 z-0">
                <Image
                    source={displayImage ?? undefined}
                    contentFit="contain"
                    style={{ width: '100%', height: '100%' }}
                />
            </View>

            <View className="p-5 relative z-10 w-[65%]">

                <View className="flex-row items-center mb-3">
                    <MaterialCommunityIcons name="star-four-points" size={12} color="#FF9500" className="mr-1.5" />
                    <Text className="text-[10px] font-medium text-brand uppercase tracking-wider">
                        {t("todays_recommendation")}
                    </Text>
                </View>

                <Text className="text-3xl font-semibold text-ink mb-3" numberOfLines={1}>
                    {t(displayNameKey)}
                </Text>

                <View className="flex-row items-center bg-sand self-start px-3 py-1.5 rounded-full mb-3 border border-surface-light">
                    <Ionicons
                        name={displayTag === 'best_for_sleep' ? "moon" : "leaf"}
                        size={12}
                        color="#FF9500"
                        className="mr-1.5"
                    />
                    <Text className="text-[10px] font-medium text-ink">{t(displayTag)}</Text>
                </View>

                <Text className="text-xs text-muted mb-6 leading-5" numberOfLines={3}>
                    {t(displayDescKey)}
                </Text>

                <View className="flex-row gap-6 mb-6">
                    <View>
                        <View className="flex-row items-center mb-1">
                            <Ionicons name="time-outline" size={12} color="gray" />
                            <Text className="text-[10px] text-muted ml-1">{t("duration")}</Text>
                        </View>
                        <Text className="text-sm font-semibold text-ink">
                            {displayDuration - 2 > 0 ? displayDuration - 2 : displayDuration} - {displayDuration + 5} {t("min")}
                        </Text>
                    </View>
                    <View>
                        <View className="flex-row items-center mb-1">
                            <Ionicons name={displayBestTime === 'before_bed' ? "moon-outline" : "sunny-outline"} size={12} color="gray" />
                            <Text className="text-[10px] text-muted ml-1">{t("best_time")}</Text>
                        </View>
                        <Text className="text-sm font-semibold text-ink">{t(displayBestTime)}</Text>
                    </View>
                </View>
            </View>

            <View className="px-5 pb-5 pt-0 flex-row gap-2 relative z-10 w-full">

                <Pressable
                    disabled={isLoading}
                    onPress={() => onStartPractice(mudra.id, displayNameKey, displayDuration)}
                    className="bg-brand flex-1 py-3.5 rounded-full flex-row items-center justify-center active:opacity-80"
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-xs mr-2" numberOfLines={1}>{t("start_practice")}</Text>
                            <Ionicons name="play-circle" size={18} color="#FFF" />
                        </>
                    )}
                </Pressable>

                <Pressable
                    disabled={isLoading}
                    onPress={() => onStartPractice(mudra.id, displayNameKey, 5)}
                    className="bg-sand border border-surface-light px-4 py-3.5 rounded-full justify-center items-center active:opacity-70"
                >
                    <Text className="text-ink font-medium text-xs" numberOfLines={1}>
                        {t("start")} 5 {t("min")}
                    </Text>
                </Pressable>

                {/* <Pressable
                    disabled={isLoading}
                    onPress={() => onSaveMudra(mudra.id)}
                    className="bg-surface-light border border-surface-light px-4 py-3.5 rounded-2xl flex-row justify-center items-center active:opacity-70"
                >
                    <Ionicons
                        name={isSaved ? "bookmark" : "bookmark-outline"}
                        size={16}
                        color={isSaved ? "#FF9500" : "gray"}
                        className="mr-1"
                    />
                    <Text className="text-ink font-medium text-xs">Save</Text>
                </Pressable> */}
            </View>
        </View>
    );
}
