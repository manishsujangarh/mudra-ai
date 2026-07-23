import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Animated,
    Vibration,
    Platform,
    Alert,
    Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
    useAudioPlayer,
    setAudioModeAsync,
} from "expo-audio";
import PremiumLock from "@/components/PremiumLock";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";
type TimerMode = "breathing" | "meditation";

interface BreathingPattern {
    id: string;
    label: string;
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
    description: string;
}

interface ScheduleEntry {
    id: string;
    hour: number;
    minute: number;
    days: number[]; // 0=Sun … 6=Sat
    enabled: boolean;
    notificationId: string | null;
}

// ---------------------------------------------------------------------------
// Breathing patterns
// ---------------------------------------------------------------------------

const BREATHING_PATTERNS: BreathingPattern[] = [
    {
        id: "box",
        label: "Box Breathing (4-4-4-4)",
        inhale: 4,
        hold: 4,
        exhale: 4,
        rest: 0,
        description: "Inhale 4s · Hold 4s · Exhale 4s — used by Navy SEALs to stay calm under pressure.",
    },
    {
        id: "relax",
        label: "4-7-8 Relaxing Breath",
        inhale: 4,
        hold: 7,
        exhale: 8,
        rest: 0,
        description: "Dr. Weil's technique — inhale 4s, hold 7s, exhale 8s. Promotes deep relaxation and sleep.",
    },
    {
        id: "coherent",
        label: "Coherent Breathing (5-5)",
        inhale: 5,
        hold: 0,
        exhale: 5,
        rest: 0,
        description: "5.5 breaths per minute — balances the autonomic nervous system.",
    },
    {
        id: "ujjayi",
        label: "Ujjayi (Ocean Breath)",
        inhale: 4,
        hold: 2,
        exhale: 6,
        rest: 0,
        description: "Slightly constrict the throat to create an ocean-like sound. Warming and focusing.",
    },
    {
        id: "kumbhaka",
        label: "Kumbhaka Pranayama",
        inhale: 4,
        hold: 8,
        exhale: 4,
        rest: 0,
        description: "Traditional breath retention — build inner stillness and lung capacity.",
    },
];

// ---------------------------------------------------------------------------
// Default schedule — morning & evening
// ---------------------------------------------------------------------------

const DEFAULT_SCHEDULE: ScheduleEntry[] = [
    {
        id: "morning",
        hour: 7,
        minute: 0,
        days: [1, 2, 3, 4, 5, 6, 7], // all days
        enabled: true,
        notificationId: null,
    },
    {
        id: "evening",
        hour: 20,
        minute: 0,
        days: [1, 2, 3, 4, 5, 6, 7],
        enabled: true,
        notificationId: null,
    },
];

const SCHEDULE_STORAGE_KEY = "breathing_meditation_schedule";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------------------------------------------------------------------------
// Helper — format seconds → MM:SS
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BreathingMeditationScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    // ---- Tab state ----
    const [mode, setMode] = useState<TimerMode>("breathing");

    // ---- Breathing state ----
    const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
    const [breathingActive, setBreathingActive] = useState(false);
    const [breathingPhase, setBreathingPhase] = useState<BreathPhase>("inhale");
    const [breathingTimeLeft, setBreathingTimeLeft] = useState(0);
    const [breathingRounds, setBreathingRounds] = useState(0);
    const [breathingTotalRounds, setBreathingTotalRounds] = useState(10);

    // ---- Meditation timer state ----
    const [meditationMinutes, setMeditationMinutes] = useState(10);
    const [meditationActive, setMeditationActive] = useState(false);
    const [meditationTimeLeft, setMeditationTimeLeft] = useState(10 * 60);
    const [meditationPaused, setMeditationPaused] = useState(false);

    // ---- Schedule state ----
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(DEFAULT_SCHEDULE);
    const [showScheduleEditor, setShowScheduleEditor] = useState(false);
    const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);

    // ---- Animated circle ----
    const breathAnim = useRef(new Animated.Value(1)).current;
    const meditationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const breathingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // ---- Audio references ----
    const phasePlayer = useAudioPlayer(
        require("../../assets/audio/timer-bell.wav")
    );

    // ---- Phase sound rates — each phase gets a distinct tone ----
    const PHASE_SOUND_RATES: Record<BreathPhase, number> = {
        inhale: 1.0,
        hold: 1.5,
        exhale: 0.75,
        rest: 0.5,
    };

    // Pre-load phase cue sound on mount
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
        }).catch(console.warn);
    }, []);

    // Helper — play a short cue for the current phase
    const playPhaseCue = useCallback(
        (phase: BreathPhase) => {
            try {
                phasePlayer.seekTo(0);

                phasePlayer.playbackRate = PHASE_SOUND_RATES[phase] ?? 1.0;
                phasePlayer.volume = 0.5;

                phasePlayer.play();
            } catch {
                // Ignore audio errors
            }
        },
        [phasePlayer]
    );

    // Load persisted schedule
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
                if (stored) {
                    setSchedule(JSON.parse(stored));
                }
            } catch { /* ignore */ }
        })();
    }, []);

    // Persist schedule on change
    const persistSchedule = useCallback(async (entries: ScheduleEntry[]) => {
        setSchedule(entries);
        await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(entries));
    }, []);

    // ---- Breathing Animation Loop ----
    useEffect(() => {
        if (!breathingActive) return;

        const pattern = selectedPattern;
        const phases: { phase: BreathPhase; duration: number }[] = [
            { phase: "inhale", duration: pattern.inhale },
            ...(pattern.hold > 0 ? [{ phase: "hold" as BreathPhase, duration: pattern.hold }] : []),
            { phase: "exhale", duration: pattern.exhale },
            ...(pattern.rest > 0 ? [{ phase: "rest" as BreathPhase, duration: pattern.rest }] : []),
        ];

        let phaseIdx = 0;
        let secondsRemaining = phases[0].duration;
        setBreathingPhase(phases[0].phase);
        setBreathingTimeLeft(phases[0].duration);
        playPhaseCue(phases[0].phase);

        // Start breath-circle animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(breathAnim, {
                    toValue: 1.4,
                    duration: pattern.inhale * 1000,
                    useNativeDriver: true,
                }),
                ...(pattern.hold > 0
                    ? [
                        Animated.timing(breathAnim, {
                            toValue: 1.4,
                            duration: pattern.hold * 1000,
                            useNativeDriver: true,
                        }),
                    ]
                    : []),
                Animated.timing(breathAnim, {
                    toValue: 1,
                    duration: pattern.exhale * 1000,
                    useNativeDriver: true,
                }),
                ...(pattern.rest > 0
                    ? [
                        Animated.timing(breathAnim, {
                            toValue: 1,
                            duration: pattern.rest * 1000,
                            useNativeDriver: true,
                        }),
                    ]
                    : []),
            ])
        ).start();

        // Per-second tick
        breathingInterval.current = setInterval(() => {
            secondsRemaining -= 1;
            setBreathingTimeLeft(secondsRemaining);

            if (secondsRemaining <= 0) {
                // Advance to next phase
                phaseIdx += 1;
                if (phaseIdx >= phases.length) {
                    // One round complete
                    setBreathingRounds((r) => {
                        const next = r + 1;
                        if (next >= breathingTotalRounds) {
                            // Finished
                            setBreathingActive(false);
                            Vibration.vibrate(300);
                            Alert.alert(
                                t("well_done") || "Well Done! 🎉",
                                `${t("completed_breathing_rounds") || "You completed"} ${breathingTotalRounds} ${t("rounds") || "rounds"}.`
                            );
                            return 0;
                        }
                        return next;
                    });
                    phaseIdx = 0;
                }
                const nextPhase = phases[phaseIdx];
                setBreathingPhase(nextPhase.phase);
                secondsRemaining = nextPhase.duration;
                setBreathingTimeLeft(nextPhase.duration);
                playPhaseCue(nextPhase.phase);
            }
        }, 1000);

        return () => {
            breathAnim.stopAnimation();
            breathAnim.setValue(1);
            if (breathingInterval.current) clearInterval(breathingInterval.current);
        };
    }, [breathingActive, selectedPattern, breathingTotalRounds, playPhaseCue]);

    // ---- Meditation Timer Loop ----
    useEffect(() => {
        if (meditationActive && !meditationPaused) {
            meditationInterval.current = setInterval(() => {
                setMeditationTimeLeft((prev) => {
                    if (prev <= 1) {
                        Vibration.vibrate([0, 400, 200, 400]);
                        setMeditationActive(false);
                        Alert.alert(
                            t("meditation_complete") || "Meditation Complete 🧘",
                            t("meditation_complete_sub") || "Your meditation session has finished."
                        );
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (meditationInterval.current) clearInterval(meditationInterval.current);
        };
    }, [meditationActive, meditationPaused]);

    // ---- Schedule Notifications ----
    const scheduleNotification = useCallback(async (entry: ScheduleEntry): Promise<string | null> => {
        try {
            // Cancel existing if any
            if (entry.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(entry.notificationId);
            }

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: t("breathe_reminder_title") || "Time to Breathe 🌬️",
                    body: t("breathe_reminder_body") || "Take a moment for your breathing practice.",
                    sound: "default",
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    hour: entry.hour,
                    minute: entry.minute,
                    weekday: entry.days[0] as any, // uses first enabled day
                },
            });

            return id;
        } catch (error) {
            console.warn("Failed to schedule breathing reminder:", error);
            return null;
        }
    }, [t]);

    const saveSchedule = useCallback(async (entry: ScheduleEntry) => {
        const notificationId = await scheduleNotification(entry);
        const updatedEntry = { ...entry, notificationId };

        const newSchedule = schedule.map((s) =>
            s.id === entry.id ? updatedEntry : s
        );
        await persistSchedule(newSchedule);
    }, [schedule, persistSchedule, scheduleNotification]);

    const toggleScheduleDay = (entryId: string, day: number) => {
        const entry = schedule.find((s) => s.id === entryId);
        if (!entry) return;
        const days = entry.days.includes(day)
            ? entry.days.filter((d) => d !== day)
            : [...entry.days, day].sort();
        const updated = { ...entry, days };
        saveSchedule(updated);
    };

    const toggleScheduleEnabled = (entryId: string) => {
        const entry = schedule.find((s) => s.id === entryId);
        if (!entry) return;
        const updated = { ...entry, enabled: !entry.enabled };
        saveSchedule(updated);
    };

    // ---- Phase label ----
    const phaseLabel = {
        inhale: t("inhale") || "Inhale",
        hold: t("hold") || "Hold",
        exhale: t("exhale") || "Exhale",
        rest: t("rest") || "Rest",
    }[breathingPhase];

    const phaseColor = {
        inhale: "#4ADE80",
        hold: "#FACC15",
        exhale: "#60A5FA",
        rest: "#A78BFA",
    }[breathingPhase];

    // ---- UI ----
    return (
        <PremiumLock
            lockedMessage={t("breathing_premium_msg") || "Breathing exercises & guided meditation are premium features."}
        >
            <SafeAreaView className="flex-1 bg-sand dark:bg-zinc-950" edges={["top"]}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2">
                        <Ionicons name="arrow-back" size={24} color="#777777" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-ink dark:text-white">
                        {t("breathing_meditation") || "Breathing & Meditation"}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowScheduleEditor(!showScheduleEditor)}
                        className="p-2"
                    >
                        <Ionicons
                            name="alarm-outline"
                            size={24}
                            color={showScheduleEditor ? "#FF9500" : "#777777"}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* ----- Mode Tabs ----- */}
                    <View className="flex-row mx-5 mt-2 bg-surface dark:bg-zinc-800 rounded-full p-1">
                        <TouchableOpacity
                            onPress={() => setMode("breathing")}
                            className={`flex-1 py-3 rounded-full items-center ${mode === "breathing" ? "bg-brand" : ""}`}
                            activeOpacity={0.7}
                        >
                            <Text
                                className={`font-semibold text-sm ${mode === "breathing" ? "text-white" : "text-muted"}`}
                            >
                                🌬️ {t("breathing") || "Breathing"}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setMode("meditation")}
                            className={`flex-1 py-3 rounded-full items-center ${mode === "meditation" ? "bg-brand" : ""}`}
                            activeOpacity={0.7}
                        >
                            <Text
                                className={`font-semibold text-sm ${mode === "meditation" ? "text-white" : "text-muted"}`}
                            >
                                🧘 {t("meditation") || "Meditation"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ================================================================ */}
                    {/* BREATHING MODE                                                     */}
                    {/* ================================================================ */}
                    {mode === "breathing" && (
                        <View className="px-5 mt-6">
                            {/* Animated circle */}
                            <View className="items-center mb-8">
                                <Animated.View
                                    style={{
                                        transform: [{ scale: breathAnim }],
                                        width: 180,
                                        height: 180,
                                        borderRadius: 90,
                                        backgroundColor: phaseColor + "30",
                                        borderWidth: 3,
                                        borderColor: phaseColor,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {breathingActive ? (
                                        <>
                                            <Text className="text-4xl font-black" style={{ color: phaseColor }}>
                                                {breathingTimeLeft}
                                            </Text>
                                            <Text className="text-base font-semibold mt-2" style={{ color: phaseColor }}>
                                                {phaseLabel}
                                            </Text>
                                            <Text className="text-xs text-muted mt-1">
                                                {t("round") || "Round"} {breathingRounds + 1}/{breathingTotalRounds}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-base font-semibold text-muted text-center px-4">
                                            {t("tap_start_breathing") || "Tap Start to begin breathing"}
                                        </Text>
                                    )}
                                </Animated.View>
                            </View>

                            {/* Pattern selector */}
                            <Text className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
                                {t("pattern") || "Pattern"}
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                {BREATHING_PATTERNS.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => {
                                            if (!breathingActive) setSelectedPattern(p);
                                        }}
                                        className={`mr-3 rounded-xl px-4 py-3 border ${selectedPattern.id === p.id
                                            ? "border-brand bg-brand/10"
                                            : "border-surface-light bg-surface dark:bg-zinc-800"
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={`text-xs font-semibold ${selectedPattern.id === p.id ? "text-brand" : "text-ink dark:text-white"}`}
                                            numberOfLines={1}
                                        >
                                            {p.label}
                                        </Text>
                                        <Text className="text-xs text-muted mt-1" numberOfLines={2}>
                                            {p.description}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Rounds selector */}
                            <Text className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
                                {t("rounds") || "Rounds"}
                            </Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {[5, 10, 15, 20, 30].map((n) => (
                                    <TouchableOpacity
                                        key={n}
                                        onPress={() => !breathingActive && setBreathingTotalRounds(n)}
                                        className={`px-5 py-2.5 rounded-full border ${breathingTotalRounds === n
                                            ? "bg-brand border-brand"
                                            : "border-surface-light bg-surface dark:bg-zinc-800"
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={`font-semibold text-sm ${breathingTotalRounds === n ? "text-white" : "text-ink dark:text-white"}`}
                                        >
                                            {n}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Start / Stop */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (breathingActive) {
                                        setBreathingActive(false);
                                        setBreathingRounds(0);
                                        setBreathingPhase("inhale");
                                        setBreathingTimeLeft(selectedPattern.inhale);
                                    } else {
                                        setBreathingRounds(0);
                                        setBreathingPhase("inhale");
                                        setBreathingTimeLeft(selectedPattern.inhale);
                                        setBreathingActive(true);
                                        playPhaseCue("inhale");
                                    }
                                }}
                                className={`w-full py-4 rounded-2xl items-center ${breathingActive ? "bg-red-500" : "bg-brand"}`}
                                activeOpacity={0.7}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {breathingActive
                                        ? t("stop") || "Stop"
                                        : t("start_breathing") || "Start Breathing"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ================================================================ */}
                    {/* MEDITATION MODE                                                   */}
                    {/* ================================================================ */}
                    {mode === "meditation" && (
                        <View className="px-5 mt-6">
                            {/* Timer circle */}
                            <View className="items-center mb-8">
                                <View
                                    className="w-48 h-48 rounded-full items-center justify-center border-4 border-brand/30 bg-brand/5"
                                >
                                    {meditationActive ? (
                                        <Text className="text-5xl font-black text-brand">
                                            {formatTime(meditationTimeLeft)}
                                        </Text>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setMeditationTimeLeft(meditationMinutes * 60);
                                                setMeditationActive(true);
                                                setMeditationPaused(false);
                                            }}
                                            className="items-center"
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="play-circle" size={56} color="#FF9500" />
                                            <Text className="text-xs text-muted mt-1">
                                                {t("tap_to_begin") || "Tap to begin"}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Pause / Resume */}
                                {meditationActive && (
                                    <View className="flex-row gap-4 mt-5">
                                        <TouchableOpacity
                                            onPress={() => setMeditationPaused(!meditationPaused)}
                                            className="bg-surface dark:bg-zinc-800 border border-surface-light rounded-full px-6 py-2.5 flex-row items-center"
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={meditationPaused ? "play" : "pause"}
                                                size={18}
                                                color="#FF9500"
                                            />
                                            <Text className="text-brand font-semibold ml-2">
                                                {meditationPaused ? t("resume") || "Resume" : t("pause") || "Pause"}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setMeditationActive(false);
                                                setMeditationPaused(false);
                                                setMeditationTimeLeft(meditationMinutes * 60);
                                            }}
                                            className="bg-red-500/10 border border-red-500/30 rounded-full px-6 py-2.5 flex-row items-center"
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="stop" size={18} color="#EF4444" />
                                            <Text className="text-red-500 font-semibold ml-2">
                                                {t("stop") || "Stop"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Duration selector */}
                            <Text className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
                                {t("duration") || "Duration"}
                            </Text>
                            <View className="flex-row flex-wrap gap-2 mb-8">
                                {[5, 10, 15, 20, 30, 45, 60].map((min) => (
                                    <TouchableOpacity
                                        key={min}
                                        onPress={() => {
                                            if (!meditationActive) {
                                                setMeditationMinutes(min);
                                                setMeditationTimeLeft(min * 60);
                                            }
                                        }}
                                        className={`px-5 py-2.5 rounded-full border ${meditationMinutes === min && !meditationActive
                                            ? "bg-brand border-brand"
                                            : "border-surface-light bg-surface dark:bg-zinc-800"
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={`font-semibold text-sm ${meditationMinutes === min && !meditationActive
                                                ? "text-white"
                                                : "text-ink dark:text-white"
                                                }`}
                                        >
                                            {min} min
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ================================================================ */}
                    {/* SCHEDULE EDITOR                                                    */}
                    {/* ================================================================ */}
                    {showScheduleEditor && (
                        <View className="px-5 mt-6 mb-8">
                            <Text className="text-base font-bold text-ink dark:text-white mb-4">
                                {t("daily_reminder_schedule") || "Daily Reminder Schedule"}
                            </Text>
                            <Text className="text-sm text-muted mb-4">
                                {t("schedule_description") || "Set daily reminders for your breathing and meditation practice."}
                            </Text>

                            {schedule.map((entry) => (
                                <View
                                    key={entry.id}
                                    className="bg-surface dark:bg-zinc-800 rounded-2xl p-4 mb-3 border border-surface-light"
                                >
                                    <View className="flex-row items-center justify-between mb-3">
                                        <View className="flex-row items-center">
                                            <Ionicons
                                                name={entry.id === "morning" ? "sunny-outline" : "moon-outline"}
                                                size={20}
                                                color="#FF9500"
                                            />
                                            <Text className="text-base font-semibold text-ink dark:text-white ml-2">
                                                {entry.id === "morning"
                                                    ? t("morning") || "Morning"
                                                    : t("evening") || "Evening"}
                                            </Text>
                                        </View>
                                        <Switch
                                            value={entry.enabled}
                                            onValueChange={() => toggleScheduleEnabled(entry.id)}
                                            trackColor={{ false: "#D1D5DB", true: "#FED7AA" }}
                                            thumbColor={entry.enabled ? "#FF9500" : "#9CA3AF"}
                                        />
                                    </View>

                                    {/* Time display */}
                                    <Text className="text-2xl font-black text-brand mb-3">
                                        {String(entry.hour).padStart(2, "0")}:{String(entry.minute).padStart(2, "0")}
                                    </Text>

                                    {/* Day pills */}
                                    <View className="flex-row flex-wrap gap-2">
                                        {DAY_LABELS.map((label, idx) => {
                                            const dayNum = idx + 1; // 1=Mon … 7=Sun
                                            const isSelected = entry.days.includes(dayNum);
                                            return (
                                                <TouchableOpacity
                                                    key={label}
                                                    onPress={() => toggleScheduleDay(entry.id, dayNum)}
                                                    className={`px-3 py-1.5 rounded-full border ${isSelected
                                                        ? "bg-brand border-brand"
                                                        : "border-surface-light bg-transparent"
                                                        }`}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        className={`text-xs font-semibold ${isSelected ? "text-white" : "text-muted"}`}
                                                    >
                                                        {label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}

                            {/* Save button */}
                            <TouchableOpacity
                                onPress={() => {
                                    schedule.forEach((entry) => {
                                        if (entry.enabled) saveSchedule(entry);
                                    });
                                    Alert.alert(
                                        t("schedule_saved") || "Schedule Saved ✅",
                                        t("schedule_saved_msg") || "Your daily reminders have been updated."
                                    );
                                }}
                                className="bg-brand rounded-2xl py-4 items-center mt-4"
                                activeOpacity={0.7}
                            >
                                <Text className="text-white font-bold text-base">
                                    {t("save_schedule") || "Save Schedule"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </PremiumLock>
    );
}