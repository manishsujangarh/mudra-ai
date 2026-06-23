import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <View className="flex-row items-center rounded-full bg-brand/10 px-3 py-1.5">
      <MaterialIcons name="local-fire-department" size={16} color="#f97316" />

      <Text className="ml-1 text-sm font-bold text-brand">
        {streak} day{streak === 1 ? "" : "s"}
      </Text>
    </View>
  );
}