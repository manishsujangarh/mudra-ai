import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";

const MAIN_MOODS = [
    { id: "anxious", label: "mood_anxious", icon: "emoticon-sad-outline", color: "#F97316" },
    { id: "stressed", label: "mood_stressed", icon: "emoticon-dead-outline", color: "#EF4444" },
    { id: "overthinking", label: "mood_overthinking", icon: "head-lightbulb-outline", color: "#A855F7" },
    { id: "tired", label: "mood_tired", icon: "sleep", color: "#3B82F6" },
    { id: "low_energy", label: "mood_low_energy", icon: "battery-10", color: "#22C55E" },
    { id: "more", label: "more", icon: "dots-horizontal", color: "#9CA3AF" },
];

const ALL_MOODS = [
    { id: "anxious", label: "mood_anxious", icon: "emoticon-sad-outline", color: "#F97316" },
    { id: "stressed", label: "mood_stressed", icon: "emoticon-dead-outline", color: "#EF4444" },
    { id: "overthinking", label: "mood_overthinking", icon: "head-lightbulb-outline", color: "#A855F7" },
    { id: "tired", label: "mood_tired", icon: "sleep", color: "#3B82F6" },
    { id: "low_energy", label: "mood_low_energy", icon: "battery-10", color: "#22C55E" },
    { id: "angry", label: "mood_angry", icon: "emoticon-angry-outline", color: "#DC2626" },
    { id: "sad", label: "mood_sad", icon: "emoticon-cry-outline", color: "#60A5FA" },
    { id: "unfocused", label: "mood_unfocused", icon: "brain", color: "#D946EF" },
];

interface MoodSelectorProps {
    selectedMood: string | null;
    onMoodSelect: (moodId: string) => void;
}

export function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
    const { t } = useTranslation();

    // 🔥 States for Modals
    const [isMoreModalVisible, setIsMoreModalVisible] = useState(false);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false); // New Info Modal State

    const handlePress = (moodId: string) => {
        if (moodId === "more") {
            setIsMoreModalVisible(true);
        } else {
            onMoodSelect(moodId);
            setIsMoreModalVisible(false);
        }
    };

    return (
        <>
            <View className="mt-8 bg-surface border border-surface-light p-4 rounded-3xl">
                <View className="flex-row items-center relative justify-between mb-4">
                    <View>
                        <Text className="text-base font-bold text-ink">{t("how_are_you_feeling")}</Text>
                        <Text className="text-[11px] text-muted mt-0.5">{t("mood_subtitle")}</Text>
                    </View>

                    {/* 🔥 "Why this?" Button Updated with Pressable */}
                    <Pressable
                        className="flex-row absolute top-0 right-0 bg-surface-light px-2 py-1 rounded-full border border-surface-light/50 items-center active:opacity-70"
                        onPress={() => setIsInfoModalVisible(true)}
                    >
                        <Text className="text-[10px] text-muted mr-1">{t("why_this")}</Text>
                        <Ionicons name="information-circle-outline" size={12} color="gray" />
                    </Pressable>
                </View>

                {/* Horizontal Scroll for Main Moods */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                    {MAIN_MOODS.map((mood) => (
                        <Pressable
                            key={mood.id}
                            onPress={() => handlePress(mood.id)}
                            className={`items-center justify-center p-3 rounded-2xl border w-[75px] h-[85px] ${selectedMood === mood.id ? "bg-brand/10 border-brand" : "bg-surface-light border-transparent"
                                }`}
                        >
                            <MaterialCommunityIcons name={mood.icon as any} size={28} color={mood.color} className="mb-2" />
                            <Text className="text-[10px] py-1 font-medium text-muted text-center leading-3" numberOfLines={1}>
                                {t(mood.label)}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* ================= 'WHY THIS?' INFO MODAL ================= */}
            <Modal
                visible={isInfoModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsInfoModalVisible(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setIsInfoModalVisible(false)}
                    className="p-4"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="bg-surface rounded-3xl p-4 w-[85%] items-center"
                    >
                        <View className="w-16 h-16 p-2 bg-brand/10 rounded-full items-center justify-center mb-4">
                            <MaterialCommunityIcons name="magic-staff" size={32} color="#F97316" />
                        </View>
                        <Text className="text-xl font-bold text-ink text-center mb-2">{t("why_we_ask_title")}</Text>
                        <Text className="text-sm text-muted text-center leading-6 mb-6">
                            {t("why_we_ask_desc")}
                        </Text>

                        <Pressable
                            className="bg-brand w-full py-3.5 rounded-2xl items-center active:opacity-80"
                            onPress={() => setIsInfoModalVisible(false)}
                        >
                            <Text className="text-white px-4 font-bold">{t("got_it")}</Text>
                        </Pressable>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ================= 'MORE' BOTTOM SHEET MODAL ================= */}
            <Modal
                visible={isMoreModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsMoreModalVisible(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                    activeOpacity={1}
                    onPress={() => setIsMoreModalVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="bg-surface rounded-t-3xl pt-5 pb-10 px-5"
                    >
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-xl font-bold text-ink">{t("all_moods")}</Text>
                                <Text className="text-xs text-muted mt-1">{t("select_current_feeling")}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsMoreModalVisible(false)} className="p-2 bg-surface-light rounded-full">
                                <Ionicons name="close" size={20} color="gray" />
                            </TouchableOpacity>
                        </View>

                        {/* Grid for All Moods */}
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {ALL_MOODS.map((mood) => (
                                <Pressable
                                    key={mood.id}
                                    onPress={() => handlePress(mood.id)}
                                    className={`items-center justify-center p-3 rounded-2xl border w-[23%] aspect-square ${selectedMood === mood.id ? "bg-brand/10 border-brand" : "bg-surface-light border-transparent"
                                        }`}
                                >
                                    <MaterialCommunityIcons name={mood.icon as any} size={28} color={mood.color} className="mb-2" />
                                    <Text className="text-[10px] font-medium text-muted text-center leading-3">
                                        {t(mood.label)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}