import { useEffect, useState } from "react";
import { DeviceEventEmitter, Platform, View } from "react-native";

import { configuredBannerUnitId } from "@/ads/units";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AdsModule = typeof import("react-native-google-mobile-ads");

export function AdBanner() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [ads, setAds] = useState<AdsModule | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;

    try {
      setAds(require("react-native-google-mobile-ads") as AdsModule);
    } catch {
      setAds(null);
    }
  }, []);

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

  if (isPremium === true || isPremium === null || !ads || hidden) return null;

  const unitId = configuredBannerUnitId ?? ads.TestIds.BANNER;

  return (
    <View className="items-center border-t border-sand-deep/60 bg-surface py-1">
      <ads.BannerAd
        unitId={unitId}
        size={ads.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setHidden(true)}
      />
    </View>
  );
}
