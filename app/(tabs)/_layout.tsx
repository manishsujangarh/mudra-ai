import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { ColorValue, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

interface TabIconProps {
  name: "home" | "search" | "sparkles" | "calendar";
  color: ColorValue;
  focused: boolean;
}

/**
 * Bottom tab navigation SVG icons with focused states.
 */
function TabIcon({ name, color, focused }: TabIconProps) {
  const stroke = String(color);
  const strokeWidth = focused ? 2.3 : 1.8;
  const size = focused ? 24 : 22;

  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
  };

  const pathProps = {
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "home") {
    return (
      <Svg {...iconProps}>
        <Path d="M3 11.5 12 4l9 7.5" {...pathProps} />
        <Path
          d="M5 10.5V20h5v-5h4v5h5v-9.5"
          {...pathProps}
          fill={focused ? stroke : "none"}
          fillOpacity={focused ? 0.15 : 0}
        />
      </Svg>
    );
  }

  if (name === "search") {
    return (
      <Svg {...iconProps}>
        <Circle cx="11" cy="11" r="7" {...pathProps} />
        <Path d="m16.5 16.5 4 4" {...pathProps} />
      </Svg>
    );
  }

  if (name === "sparkles") {
    return (
      <Svg {...iconProps}>
        <Path
          d="M12 3 14.4 8.6 20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3Z"
          {...pathProps}
          fill={focused ? stroke : "none"}
          fillOpacity={focused ? 0.2 : 0}
        />
        <Path d="M19 3v4" {...pathProps} />
        <Path d="M21 5h-4" {...pathProps} />
      </Svg>
    );
  }

  return (
    <Svg {...iconProps}>
      <Path d="M7 3v4" {...pathProps} />
      <Path d="M17 3v4" {...pathProps} />
      <Path d="M4 9h16" {...pathProps} />
      <Path
        d="M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        {...pathProps}
      />
    </Svg>
  );
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Dynamic calculations based on safe area bottom insets
  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 8);
  const tabBarHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF9500",
        tabBarInactiveTintColor: isDark ? "#8E8E93" : "#8E8E93",
        tabBarStyle: {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderTopColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
          borderTopWidth: 0.5,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomInset,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
          includeFontPadding: false,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("explore"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="search" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("ai_guide"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sparkles" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: t("routines"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}