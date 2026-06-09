import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { configuredInterstitialUnitId } from "@/ads/units";
import { usePreferences } from "@/hooks/usePreferences";

type AdsModule = typeof import("react-native-google-mobile-ads");
type InterstitialAd = ReturnType<AdsModule["InterstitialAd"]["createForAdRequest"]>;

export function useSessionCompletionInterstitial() {
  const { data: preferences, isLoading } = usePreferences();
  const adRef = useRef<InterstitialAd | null>(null);
  const adsRef = useRef<AdsModule | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" || isLoading || preferences?.adsRemoved) return;

    try {
      const ads = require("react-native-google-mobile-ads") as AdsModule;
      const unitId = configuredInterstitialUnitId ?? ads.TestIds.INTERSTITIAL;
      const interstitial = ads.InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      adsRef.current = ads;
      adRef.current = interstitial;

      const unsubscribeLoaded = interstitial.addAdEventListener(
        ads.AdEventType.LOADED,
        () => setIsLoaded(true)
      );
      const unsubscribeError = interstitial.addAdEventListener(
        ads.AdEventType.ERROR,
        () => setIsLoaded(false)
      );

      interstitial.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeError();
        adRef.current = null;
        adsRef.current = null;
      };
    } catch {
      adRef.current = null;
      adsRef.current = null;
    }
  }, [preferences?.adsRemoved]);

  const showAfterCompletion = useCallback(
    (onFinished: () => void) => {
      if (preferences?.adsRemoved) {
        onFinished();
        return false;
      }

      const ad = adRef.current;
      const ads = adsRef.current;

      if (isLoading || preferences?.adsRemoved) {
        onFinished();
        return false;
      }

      if (!ad || !ads || !isLoaded) {
        ad?.load();
        onFinished();
        return false;
      }

      let unsubscribeClosed: (() => void) | undefined;
      const finish = () => {
        unsubscribeClosed?.();
        setIsLoaded(false);
        ad.load();
        onFinished();
      };

      unsubscribeClosed = ad.addAdEventListener(ads.AdEventType.CLOSED, finish);

      try {
        ad.show();
        return true;
      } catch {
        finish();
        return false;
      }
    },
    [isLoaded, preferences?.adsRemoved]
  );

  return { isLoaded, showAfterCompletion };
}
