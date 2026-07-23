import React, { ReactNode, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

/**
 * PremiumLock — gates a feature section behind the premium paywall.
 *
 * When `EXPO_PUBLIC_SHOW_FREE` is "true", premium features render for everyone
 * (free mode). When it's "false" or unset, the component checks the local
 * `mudra_ai_is_premium` AsyncStorage flag and shows either the children
 * (premium user) or a locked upgrade prompt.
 */

const PREMIUM_STORAGE_KEY = "mudra_ai_is_premium";

interface PremiumLockProps {
    children: ReactNode;
    /** Custom message shown on the locked state. Falls back to a default. */
    lockedMessage?: string;
    /** Optional compact variant — shows an inline lock chip instead of a full card. */
    compact?: boolean;
    /** Called when premium status is resolved. Useful for parent-driven toggles. */
    onStatusResolved?: (isUnlocked: boolean) => void;
}

export default function PremiumLock({
    children,
    lockedMessage,
    compact,
    onStatusResolved,
}: PremiumLockProps) {
    const { t } = useTranslation();
    const router = useRouter();

    const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                // 1. If the env variable says show everything for free, unlock immediately.
                const showFree = process.env.EXPO_PUBLIC_SHOW_FREE;
                if (showFree === "true") {
                    setIsUnlocked(true);
                    onStatusResolved?.(true);
                    return;
                }

                // 2. Otherwise check the persistent premium flag.
                const stored = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
                const hasPremium = stored === "true";
                setIsUnlocked(hasPremium);
                onStatusResolved?.(hasPremium);
            } catch {
                setIsUnlocked(false);
                onStatusResolved?.(false);
            }
        };

        check();
    }, []);

    // Still resolving
    if (isUnlocked === null) {
        return (
            <View className="items-center justify-center py-12">
                <ActivityIndicator size="small" color="#FF9500" />
            </View>
        );
    }

    // Unlocked — render children normally
    if (isUnlocked) {
        return <>{children}</>;
    }

    // Locked — compact variant
    if (compact) {
        return (
            <TouchableOpacity
                onPress={() => router.push("/premium")}
                className="flex-row items-center bg-brand/10 border border-brand/30 rounded-full px-3 py-1.5 self-start"
                activeOpacity={0.7}
            >
                <Ionicons name="lock-closed" size={12} color="#FF9500" />
                <Text className="text-brand text-xs font-semibold ml-1">
                    {t("premium") || "Premium"}
                </Text>
            </TouchableOpacity>
        );
    }

    // Locked — full card
    return (
        <View className="rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-brand/10 items-center justify-center mb-4">
                <Ionicons name="lock-closed" size={28} color="#FF9500" />
            </View>
            <Text className="text-base font-bold text-ink dark:text-white text-center mb-2">
                {lockedMessage || t("premium_feature_locked") || "Premium Feature"}
            </Text>
            <Text className="text-sm text-muted text-center mb-5">
                {t("premium_upgrade_prompt") ||
                    "Unlock this feature with a one-time purchase."}
            </Text>
            <TouchableOpacity
                onPress={() => router.push("/premium")}
                className="bg-brand rounded-full px-8 py-3 active:opacity-80"
                activeOpacity={0.7}
            >
                <Text className="text-white font-semibold text-base">
                    {t("upgrade_now") || "Upgrade Now"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

/**
 * Hook that returns whether premium features are currently unlocked.
 * The return value is `null` while the flag is still being resolved.
 */
export function usePremiumUnlocked(): boolean | null {
    const [unlocked, setUnlocked] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                const showFree = process.env.EXPO_PUBLIC_SHOW_FREE;
                if (showFree === "true") {
                    setUnlocked(true);
                    return;
                }
                const stored = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
                setUnlocked(stored === "true");
            } catch {
                setUnlocked(false);
            }
        };
        check();
    }, []);

    return unlocked;
}