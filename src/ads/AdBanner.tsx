import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import { configuredBannerUnitId } from "@/ads/units";
import { usePreferences } from "@/hooks/usePreferences";

type AdsModule = typeof import("react-native-google-mobile-ads");

export function AdBanner() {
  const { data: preferences, isLoading } = usePreferences();
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

  if (preferences?.adsRemoved || isLoading || !ads || hidden) return null;

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
