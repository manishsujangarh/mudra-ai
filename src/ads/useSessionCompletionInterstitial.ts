import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { configuredInterstitialUnitId } from "@/ads/units";

type AdsModule = typeof import("react-native-google-mobile-ads");
type InterstitialAd = ReturnType<AdsModule["InterstitialAd"]["createForAdRequest"]>;

export function useSessionCompletionInterstitial() {
  const adRef = useRef<InterstitialAd | null>(null);
  const adsRef = useRef<AdsModule | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

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

  // 2. Ad Loading Logic
  useEffect(() => {
    if (Platform.OS === "web" || isPremium === null || isPremium === true) return;

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
  }, [isPremium]);

  const showAfterCompletion = useCallback(
    (onFinished: () => void) => {
      if (isPremium === true) {
        onFinished();
        return false;
      }

      const ad = adRef.current;
      const ads = adsRef.current;

      if (isPremium === null) {
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
    [isLoaded, isPremium]
  );

  return { isLoaded, showAfterCompletion };
}