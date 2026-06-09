import { useEffect } from "react";
import { Platform } from "react-native";

let initialized = false;

export function MobileAdsInitializer() {
  useEffect(() => {
    if (Platform.OS === "web" || initialized) return;

    try {
      const mobileAds =
        require("react-native-google-mobile-ads").default as typeof import("react-native-google-mobile-ads").default;

      initialized = true;
      mobileAds().initialize().catch(() => {
        initialized = false;
      });
    } catch {
      initialized = false;
    }
  }, []);

  return null;
}
