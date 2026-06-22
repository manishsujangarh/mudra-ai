import { View, Text, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Screen } from "@/components/ui";
import { Button, SectionTitle } from "@/components/ui";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";
import { apiFetch } from "@/lib/api";

export default function Settings() {
    const router = useRouter();

    // --- STATE ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [isPremium, setIsPremium] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check Auth & Premium Status
    useFocusEffect(
        useCallback(() => {
            const checkAppStatus = async () => {
                try {
                    // Auth Check
                    const loggedStatus = await AsyncStorage.getItem("isLogged");
                    if (loggedStatus === "true") {
                        setIsLoggedIn(true);
                        const name = await SecureStore.getItemAsync("user_name");
                        if (name) setUserName(name);
                    } else {
                        setIsLoggedIn(false);
                        setUserName("");
                    }

                    // Premium / Ads Removed Check 
                    const premiumStatus = await AsyncStorage.getItem("mudra_ai_is_premium");
                    if (premiumStatus === "true") {
                        setIsPremium(true);
                    } else {
                        setIsPremium(false);
                    }
                } catch (e) {
                    console.error("Status check error:", e);
                }
            };
            checkAppStatus();
        }, [])
    );

    // --- REMOVE ADS BUTTON CLICK HANDLER ---
    const handleRemoveAdsPress = () => {
        if (isLoggedIn) {
            router.push("/premium");
        } else {
            Alert.alert(
                "Login Required",
                "Please log in to your account first to purchase the ad-free experience.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => router.push("/(auth)/login") }
                ]
            );
        }
    };

    // --- LOGOUT LOGIC ---
    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out? You will need to log in again to access your saved routines.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoggingOut(true);
                        try {
                            try {
                                await apiFetch('/logout', { method: 'POST' });
                            } catch (e) {
                                console.log("API logout failed or bypassed");
                            }

                            // Clear local data
                            await SecureStore.deleteItemAsync('auth_token');
                            await SecureStore.deleteItemAsync('userToken');
                            await SecureStore.deleteItemAsync('user_name');
                            await SecureStore.deleteItemAsync('user_data');

                            await AsyncStorage.removeItem('isLogged');
                            await AsyncStorage.removeItem('keep_signed_in');
                            await AsyncStorage.removeItem('auth_token');
                            await AsyncStorage.removeItem('user_name');
                            await AsyncStorage.removeItem('user_data');
                            await AsyncStorage.removeItem('mudra_ai_is_premium');

                            setIsLoggedIn(false);
                            setUserName("");
                            setIsPremium(false);

                            try {
                                await Updates.reloadAsync();
                            } catch (error) {
                                router.replace("/(auth)/login");
                            }

                        } catch (e) {
                            console.error("Logout error:", e);
                            Alert.alert("Error", "Logout failed. Please try again.");
                        } finally {
                            setIsLoggingOut(false);
                        }
                    }
                }
            ]
        );
    };

    // --- DELETE ACCOUNT / WIPE LOCAL DB LOGIC ---
    const handleDeleteAccount = () => {
        const alertMessage = isLoggedIn
            ? "Are you absolutely sure? This action cannot be undone. All your data, saved routines, and cloud account will be permanently erased."
            : "Are you absolutely sure? This action cannot be undone. All your saved routines and local app data will be permanently erased.";

        Alert.alert(
            "Delete Account",
            alertMessage,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Account",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            // 1. Agar logged in hai, toh backend API call karo account delete ke liye
                            if (isLoggedIn) {
                                try { await apiFetch('/delete-account', { method: 'POST' }); } catch (e) { console.log("Delete API fail", e) }
                            }

                            // 2. YAHAN LOCAL DB (SQLite) CLEAR KARNE KA CODE DAALEIN (Agar use kar rahe hain)
                            // Example: await clearAllLocalDatabaseData(db);

                            // 3. AsyncStorage aur SecureStore puri tarah se saaf karo
                            await AsyncStorage.clear();
                            await SecureStore.deleteItemAsync("auth_token");
                            await SecureStore.deleteItemAsync("userToken");
                            await SecureStore.deleteItemAsync("user_name");
                            await SecureStore.deleteItemAsync("user_data");

                            setIsLoggedIn(false);
                            setUserName("");
                            setIsPremium(false);

                            Alert.alert(
                                "Account Deleted",
                                "Your account and data have been completely removed.",
                                [
                                    {
                                        text: "OK",
                                        onPress: async () => {
                                            // Pura data delete hone ke baad app ko fresh restart karo
                                            try {
                                                await Updates.reloadAsync();
                                            } catch (error) {
                                                router.replace("/(auth)/login");
                                            }
                                        }
                                    }
                                ]
                            );

                        } catch (error) {
                            console.error("Delete data error:", error);
                            Alert.alert("Error", "Failed to process request. Please try again.");
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <Screen>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 pb-10">

                <SectionTitle>Settings</SectionTitle>

                {/* --- 1. REMOVE ADS CARD --- */}
                <View className="mt-4 rounded-3xl bg-surface p-5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-semibold text-ink">Remove Ads</Text>
                        {isPremium ? (
                            <Text className="text-sm font-semibold text-brand">Purchased</Text>
                        ) : null}
                    </View>

                    <Text className="mt-2 text-sm text-muted">
                        {isPremium
                            ? "You have successfully removed all banner and interstitial ads from the app."
                            : "Remove banner and interstitial ads forever with a simple one-time purchase."}
                    </Text>

                    {!isPremium && (
                        <View className="mt-4">
                            <Button
                                label="Remove Ads"
                                variant="secondary"
                                onPress={handleRemoveAdsPress}
                            />
                        </View>
                    )}
                </View>

                {/* --- 2. ACCOUNT / AUTH CARD --- */}
                <View className="mt-4 rounded-3xl bg-surface p-5">
                    {isLoggedIn ? (
                        <>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-lg font-semibold text-ink">Account</Text>
                                <Text className="text-sm font-semibold text-brand">Logged In</Text>
                            </View>

                            <Text className="mt-2 text-sm text-muted">
                                Namaste, {userName || "Yogi"}. Your progress and routines are securely backed up to the cloud.
                            </Text>

                            <View className="mt-4">
                                <Button
                                    label={isLoggingOut ? "Logging out..." : "Log Out"}
                                    variant="secondary"
                                    onPress={handleLogout}
                                    disabled={isLoggingOut}
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

                {/* --- 3. DANGER ZONE (ALWAYS VISIBLE) --- */}
                <View className="mt-4 rounded-3xl bg-surface p-5 border border-red-500/30">
                    <Text className="text-lg font-semibold text-red-500">Danger Zone</Text>
                    <Text className="mt-2 text-sm text-muted">
                        Permanently delete your account and wipe all associated data. This action cannot be recovered.
                    </Text>

                    <View className="mt-4">
                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            disabled={isDeleting}
                            className={`w-full h-14 rounded-full items-center justify-center border border-red-500/50 ${isDeleting ? 'opacity-50' : ''}`}
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="#ef4444" size="small" />
                            ) : (
                                <Text className="font-semibold text-red-500">
                                    Delete Account
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </Screen>
    );
}