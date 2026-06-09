import { useColorScheme } from "nativewind";
import { Switch, View } from "react-native";

export function ThemeSwitch() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="mr-2">
      <Switch
        accessibilityLabel="Toggle dark mode"
        value={isDark}
        onValueChange={(value) => setColorScheme(value ? "dark" : "light")}
        trackColor={{ false: "#D8D1C8", true: "#e06040" }}
        thumbColor={isDark ? "#F6F1EC" : "#FFFFFF"}
        ios_backgroundColor="#D8D1C8"
      />
    </View>
  );
}
