import { View, Text } from "react-native";
import { Screen } from "@/components/ui";
import { Button, SectionTitle } from "@/components/ui";
import { useRemoveAdsRevenueCat } from "@/ads/useRemoveAdsPurchase";

export default function Settings() {
    const {
        adsRemoved,
        isInitializing,
        isPurchasing,
        error,
        presentPaywall,
    } = useRemoveAdsRevenueCat();

    return (
        <Screen>
            <View className="p-5">
                <SectionTitle>Settings</SectionTitle>

                <View className="mt-4 rounded-3xl bg-surface p-5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-semibold text-ink">Remove ads</Text>
                        {adsRemoved ? (
                            <Text className="text-sm font-semibold text-brand">Purchased</Text>
                        ) : null}
                    </View>
                    <Text className="mt-2 text-sm text-muted">
                        Remove banner and interstitial ads with a RevenueCat purchase.
                    </Text>

                    {!adsRemoved ? (
                        <View className="mt-4">
                            <Button
                                label="Remove ads"
                                variant="secondary"
                                onPress={presentPaywall}
                                loading={isPurchasing || isInitializing}
                                disabled={isPurchasing || isInitializing}
                            />
                            {error ? (
                                <Text className="mt-2 text-xs text-red-500">{error}</Text>
                            ) : null}
                        </View>
                    ) : null}
                </View>
            </View>
        </Screen>
    );
}
