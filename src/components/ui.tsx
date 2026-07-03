import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Shared primitives so screens stay terse and visually consistent. */

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-sand" edges={[]}>
      <View className={`flex-1 ${className}`}>{children}</View>
    </SafeAreaView>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}) {
  const base =
    "rounded-2xl px-5 py-4 active:opacity-80";
  const styles = {
    primary: "bg-brand",
    secondary: "bg-surface border border-brand",
    ghost: "bg-transparent",
  }[variant];
  const textStyles = {
    primary: "text-white",
    secondary: "text-brand",
    ghost: "text-brand",
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${styles} ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#C8102E"} />
      ) : (
        <Text className={`text-base text-center font-semibold ${textStyles}`}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 mb-2 rounded-full px-3 py-1.5 ${active ? "bg-brand" : "bg-surface border border-brand-light/40"
        }`}
    >
      <Text
        className={`text-xs font-medium ${active ? "text-white" : "text-brand"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-sand">
      <ActivityIndicator size="large" color="#C8102E" />
      {message ? (
        <Text className="mt-3 text-sm text-muted">{message}</Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-center text-base font-semibold text-ink">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-2 text-center text-sm text-muted">{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
    </Text>
  );
}
