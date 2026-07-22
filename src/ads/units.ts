import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

function normalizeUnitId(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

export const configuredBannerUnitId =
  normalizeUnitId(process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID) ??
  normalizeUnitId(extra.adMobBannerUnitId);

export const configuredInterstitialUnitId =
  normalizeUnitId(process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID) ??
  normalizeUnitId(extra.adMobInterstitialUnitId);

export const configuredBannerUnitIdIOS =
  normalizeUnitId(process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_IOS) ??
  normalizeUnitId(extra.adMobBannerUnitIdIOS);

export const configuredInterstitialUnitIdIOS =
  normalizeUnitId(process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID_ios) ??
  normalizeUnitId(extra.adMobInterstitialUnitIdIOS);


