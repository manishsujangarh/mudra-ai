import { Tabs } from "expo-router";
import { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

/**
 * Bottom tab navigation. SVG icons avoid platform-specific emoji rendering
 * quirks in native tab bars.
 */
function TabIcon({
  name,
  color,
}: {
  name: "home" | "search" | "sparkles" | "calendar";
  color: ColorValue;
}) {
  const stroke = String(color);
  const iconProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
  };
  const pathProps = {
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "home") {
    return (
      <Svg {...iconProps}>
        <Path d="M3 11.5 12 4l9 7.5" {...pathProps} />
        <Path d="M5 10.5V20h5v-5h4v5h5v-9.5" {...pathProps} />
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
        <Path d="M12 3 14.4 8.6 20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3Z" {...pathProps} />
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
      <Path d="M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" {...pathProps} />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0E7C66",
        tabBarInactiveTintColor: "#6B7B77",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E5E0D8",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <TabIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Guide",
          tabBarIcon: ({ color }) => <TabIcon name="sparkles" color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: "Routines",
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
    </Tabs>
  );
}
