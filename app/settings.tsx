import { View, Text, Alert } from "react-native";
import { Screen } from "@/components/ui";
import { Button, SectionTitle } from "@/components/ui";
import { useRemoveAdsRevenueCat } from "@/ads/useRemoveAdsPurchase";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export default function Settings() {
    const router = useRouter();
    const {
        adsRemoved,
        isInitializing,
        isPurchasing,
        error,
        presentPaywall,
    } = useRemoveAdsRevenueCat();

    // --- AUTH STATE ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");

    // Ye effect jab bhi Settings screen khulegi, tab check karega ki user logged in hai ya nahi
    useFocusEffect(
        useCallback(() => {
            const checkAuthStatus = async () => {
                try {
                    const loggedStatus = await AsyncStorage.getItem("isLogged");
                    if (loggedStatus === "true") {
                        setIsLoggedIn(true);
                        const name = await SecureStore.getItemAsync("user_name");
                        if (name) setUserName(name);
                    } else {
                        setIsLoggedIn(false);
                        setUserName("");
                    }
                } catch (e) {
                    console.error("Auth check error:", e);
                }
            };
            checkAuthStatus();
        }, [])
    );

    // Logout Function with Confirmation Alert
    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out? You will need to log in again to access your saved routines.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.multiRemove(["isLogged", "keep_signed_in"]);
                            await SecureStore.deleteItemAsync("auth_token");
                            await SecureStore.deleteItemAsync("userToken");
                            await SecureStore.deleteItemAsync("user_name");
                            await SecureStore.deleteItemAsync("user_data");

                            setIsLoggedIn(false);
                            setUserName("");

                            // Optional: Logout ke baad seedha Login screen par bhej do
                            router.replace("/(auth)/login");
                        } catch (e) {
                            console.error("Logout error:", e);
                        }
                    }
                }
            ]
        );
    };

    return (
        <Screen>
            <View className="p-5">
                <SectionTitle>Settings</SectionTitle>

                {/* --- ACCOUNT / AUTH CARD --- */}
                <View className="mt-4 rounded-3xl bg-surface p-5">
                    {isLoggedIn ? (
                        <>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-lg font-semibold text-ink">Account</Text>
                                <Text className="text-sm font-semibold text-brand">Logged In</Text>
                            </View>
                            <Text className="mt-2 text-sm text-muted">
                                Namaste, {userName || "Yogi"}. Your progress and routines are securely backed up.
                            </Text>

                            <View className="mt-4">
                                <Button
                                    label="Log Out"
                                    variant="secondary"
                                    onPress={handleLogout}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-lg font-semibold text-ink">Account</Text>
                                <Text className="text-sm font-semibold text-muted">Guest</Text>
                            </View>
                            <Text className="mt-2 text-sm text-muted">
                                Create an account to save your custom routines, track your progress, and securely back up your data.
                            </Text>

                            <View className="mt-4 flex-row justify-between gap-3">
                                <View className="flex-1">
                                    <Button
                                        label="Log In"
                                        variant="secondary"
                                        onPress={() => router.push("/(auth)/login")}
                                    />
                                </View>
                                <View className="flex-1">
                                    {/* Agar primary variant ho toh wo use kar lo, nahi toh secondary */}
                                    <Button
                                        label="Sign Up"
                                        variant="secondary"
                                        onPress={() => router.push("/(auth)/signup")}
                                    />
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* --- REMOVE ADS CARD --- */}
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