import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let initialized = false;

export function MobileAdsInitializer() {
  useEffect(() => {
    const setupAds = async () => {
      if (Platform.OS === "web" || initialized) return;

      try {
        const isPremium = await AsyncStorage.getItem("mudra_ai_is_premium");

        if (isPremium === "true") return;

        const mobileAds =
          require("react-native-google-mobile-ads").default as typeof import("react-native-google-mobile-ads").default;

        initialized = true;
        mobileAds().initialize().catch(() => {
          initialized = false;
        });
      } catch {
        initialized = false;
      }
    };

    setupAds();
  }, []);

  return null;
}