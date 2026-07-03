import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export function StreakBadge({ streak }: { streak: number }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center rounded-full bg-brand/10 px-3 py-1.5">
      <MaterialIcons name="local-fire-department" size={16} color="#f97316" />

      <Text className="ml-1 text-sm font-bold text-brand">
        {streak} {streak === 1 ? t("day") : t("days")}
      </Text>
    </View>
  );
}