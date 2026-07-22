import { useEffect, useState } from "react";
import { DeviceEventEmitter, Platform, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

import { configuredBannerUnitId, configuredBannerUnitIdIOS } from "@/ads/units";

// Resolve unit ID with fallbacks
const unitId =
  Platform.OS === "ios"
    ? configuredBannerUnitIdIOS ?? TestIds.BANNER
    : configuredBannerUnitId ?? TestIds.BANNER;

export function AdBanner() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const status = await AsyncStorage.getItem("mudra_ai_is_premium");
        setIsPremium(status === "true");
      } catch {
        setIsPremium(false);
      }
    };

    checkPremiumStatus();
    const subscription = DeviceEventEmitter.addListener("PremiumUpdated", checkPremiumStatus);

    return () => subscription.remove();
  }, []);

  // Hide on Web, Premium users, or when premium status is still loading
  if (Platform.OS === "web" || isPremium === true || isPremium === null || hidden) {
    return null;
  }

  return (
    <View className="items-center border-t border-sand-deep/60 bg-surface py-1">
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setHidden(true)}
      />
    </View>
  );
}