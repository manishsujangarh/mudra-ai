import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases"

import { usePreferences, useUpdatePreferences } from "@/hooks/usePreferences";

const REMOVE_ADS_ENTITLEMENT_ID = "remove_ads";
const RC_API_KEY_ANDROID = "goog_gsSAFkwzWkgHFokjSIbZDVYWOEq";
const RC_API_KEY_IOS = "YOUR_REVENUCAT_API_KEY_IOS";

export function useRemoveAdsRevenueCat() {
    const { data: preferences } = usePreferences();
    const updatePreferences = useUpdatePreferences();
    const [isInitializing, setIsInitializing] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasEntitlement, setHasEntitlement] = useState(false);

    useEffect(() => {
        if (Platform.OS === "web") {
            setIsInitializing(false);
            return;
        }

        let mounted = true;

        async function initRevenueCat() {
            try {
                const apiKey =
                    Platform.OS === "android" ? RC_API_KEY_ANDROID : RC_API_KEY_IOS;

                if (!apiKey.startsWith("YOUR_")) {
                    Purchases.setDebugLogsEnabled(true);
                    await Purchases.configure({ apiKey });

                    const customerInfo = await Purchases.getCustomerInfo();
                    const hasAccess =
                        customerInfo.entitlements.active[REMOVE_ADS_ENTITLEMENT_ID] !==
                        undefined;

                    if (mounted) {
                        setHasEntitlement(hasAccess);
                        if (hasAccess && !preferences?.adsRemoved) {
                            await updatePreferences.mutateAsync({ adsRemoved: true });
                        }
                    }
                }
            } catch (e) {
                console.error("RevenueCat init error:", e);
            } finally {
                if (mounted) {
                    setIsInitializing(false);
                }
            }
        }

        initRevenueCat();

        return () => {
            mounted = false;
        };
    }, [updatePreferences, preferences]);

    const presentPaywall = async () => {
        if (Platform.OS === "web") return;

        setError(null);
        setIsPurchasing(true);

        try {
            const offerings = await Purchases.getOfferings();

            if (offerings.current) {
                const package_ = offerings.current.availablePackages[0];
                if (package_) {
                    const purchaserInfo = await Purchases.purchasePackage(package_);
                    const hasAccess =
                        purchaserInfo.entitlements.active[REMOVE_ADS_ENTITLEMENT_ID] !==
                        undefined;

                    if (hasAccess) {
                        setHasEntitlement(true);
                        await updatePreferences.mutateAsync({ adsRemoved: true });
                    }
                }
            }
        } catch (e) {
            if (e instanceof Error && e.message.includes("Cancelled")) {
                setError("Purchase cancelled.");
            } else {
                setError(e instanceof Error ? e.message : "Purchase failed.");
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    return {
        adsRemoved: preferences?.adsRemoved ?? false,
        hasEntitlement,
        isInitializing,
        isPurchasing,
        error,
        presentPaywall,
    };
}
