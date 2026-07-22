import React from "react";
import { Pressable, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface BackButtonProps {
    /**
     * Icon size in points. Defaults to 22.
     */
    size?: number;
    /**
     * Custom back action. Defaults to router.back().
     */
    onPress?: () => void;
    /**
     * Additional Tailwind / NativeWind class names for the Pressable wrapper.
     */
    className?: string;
}

/**
 * A consistent, theme‑aware back button.
 *
 * - Icon colour adapts to the current colour scheme: dark ink in light mode,
 *   light ink in dark mode, matching the app's `text-ink` semantic token.
 * - Wraps the icon in a rounded, surface‑coloured pill that respects the
 *   project's semantic design tokens (`bg-surface`, `border-surface-light`).
 * - Taps call `router.back()` by default; override with `onPress`.
 */
export function BackButton({ size = 22, onPress, className = "" }: BackButtonProps) {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <Pressable
            onPress={onPress ?? (() => router.back())}
            className={`p-2 rounded-full bg-surface border border-surface-light active:opacity-75 items-center justify-center ${className}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Ionicons
                name="arrow-back"
                size={size}
                color={isDark ? "#FFFFFF" : "#1C1C1E"}
            />
        </Pressable>
    );
}