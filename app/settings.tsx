import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Switch, DeviceEventEmitter, Alert } from "react-native";
import { Screen } from "@/components/ui";
import { Button, SectionTitle } from "@/components/ui";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";
import { apiFetch } from "@/lib/api";
import { AdBanner } from "@/ads/AdBanner";
import * as SQLite from "expo-sqlite";
import { useColorScheme } from "nativewind";

// Legal WebView 
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export default function Settings() {
    const router = useRouter();

    // --- STATES ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [isPremium, setIsPremium] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- PREFERENCES STATES ---
    const { colorScheme, setColorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [isKeepAwake, setIsKeepAwake] = useState(true);

    // --- LEGAL WEBVIEW STATES ---
    const [legalModalVisible, setLegalModalVisible] = useState(false);
    const [legalUrl, setLegalUrl] = useState("");
    const [legalTitle, setLegalTitle] = useState("");
    const [isLegalLoading, setIsLegalLoading] = useState(true);

    // Check Auth, Premium & Preferences Status
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

                        try {
                            const response = await apiFetch('/mudra/user', { method: 'GET' });
                            if (response && response.success && response.userdata) {
                                const isPremiumServer = response.userdata.mudra_is_premium;
                                await AsyncStorage.setItem("mudra_ai_is_premium", isPremiumServer ? "true" : "false");
                                setIsPremium(isPremiumServer);
                            } else {
                                const premiumStatus = await AsyncStorage.getItem("mudra_ai_is_premium");
                                setIsPremium(premiumStatus === "true");
                            }
                        } catch (apiErr) {
                            console.log("Failed to fetch user profile from server, using local fallback");
                            const premiumStatus = await AsyncStorage.getItem("mudra_ai_is_premium");
                            setIsPremium(premiumStatus === "true");
                        }

                    } else {
                        setIsLoggedIn(false);
                        setUserName("");
                        const premiumStatus = await AsyncStorage.getItem("mudra_ai_is_premium");
                        setIsPremium(premiumStatus === "true");
                    }

                    // Keep Awake Check
                    const keepAwakeStatus = await AsyncStorage.getItem("keep_screen_awake");
                    setIsKeepAwake(keepAwakeStatus !== "false"); // Default true
                } catch (e) {
                    console.error("Status check error:", e);
                }
            };
            checkAppStatus();
        }, [])
    );

    // --- TOGGLE HANDLERS ---
    const toggleTheme = (value: boolean) => {
        setColorScheme(value ? "dark" : "light");
    };

    const toggleKeepAwake = async (value: boolean) => {
        setIsKeepAwake(value);
        await AsyncStorage.setItem("keep_screen_awake", value ? "true" : "false");
        DeviceEventEmitter.emit("KeepAwakeUpdated");
    };

    // --- LEGAL WEBVIEW LOGIC ---
    const openLegalWebView = (url: string, title: string) => {
        setLegalUrl(url);
        setLegalTitle(title);
        setIsLegalLoading(true);
        setLegalModalVisible(true);
    };

    const hideHeaderScript = `
        setTimeout(function() {
            let headers = document.getElementsByTagName('header');
            for(let i=0; i<headers.length; i++) { headers[i].style.display = 'none'; }
            let footers = document.getElementsByTagName('footer');
            for(let i=0; i<footers.length; i++) { footers[i].style.display = 'none'; }
        }, 100);
        true;
    `;

    // --- ACTIONS ---
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

    const processLogout = async () => {
        setIsLoggingOut(true);
        try {
            try { await apiFetch('/logout', { method: 'POST' }); } catch (e) { console.log("API logout failed"); }

            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('user_name');
            await SecureStore.deleteItemAsync('user_data');

            const keysToRemove = ['isLogged', 'keep_signed_in', 'auth_token', 'user_name', 'user_data', 'mudra_ai_is_premium'];
            await AsyncStorage.multiRemove(keysToRemove);

            setIsLoggedIn(false); setUserName(""); setIsPremium(false);

            try { await Updates.reloadAsync(); } catch (error) { router.replace("/(auth)/login"); }
        } catch (e) {
            console.error("Logout error:", e);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleLogoutPress = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out? You will need to log in again.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: processLogout }
            ]
        );
    };

    const processDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            if (isLoggedIn) {
                try { await apiFetch('/delete-account', { method: 'POST' }); } catch (e) { console.log("Delete API fail", e) }
            }

            try { await SQLite.deleteDatabaseAsync("mudra-ai.db"); } catch (dbError) { console.log("Error deleting DB:", dbError); }

            await AsyncStorage.clear();
            await SecureStore.deleteItemAsync("auth_token");
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("user_name");
            await SecureStore.deleteItemAsync("user_data");

            setIsLoggedIn(false); setUserName(""); setIsPremium(false);

            Alert.alert(
                "Success",
                "Your account and data have been completely removed.",
                [
                    {
                        text: "OK", onPress: async () => {
                            try { await Updates.reloadAsync(); } catch (error) { router.replace("/(auth)/login"); }
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert("Error", "Failed to process request. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeletePress = () => {
        const message = isLoggedIn
            ? "Are you absolutely sure? All your data and cloud account will be erased."
            : "Are you absolutely sure? All your saved routines and local app data will be erased.";

        Alert.alert(
            "Delete Account",
            message,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete Account", style: "destructive", onPress: processDeleteAccount }
            ]
        );
    };

    return (
        <Screen>
            <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 pb-10">

                    <SectionTitle>Settings</SectionTitle>

                    {/* --- 1. PREFERENCES CARD (NEW) --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
                        <Text className="text-lg font-semibold text-ink mb-4">Preferences</Text>

                        {/* Theme Switch */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-1 pr-4">
                                <Text className="text-base font-medium text-ink">Dark Mode</Text>
                                <Text className="text-sm text-muted mt-1">Change the app's appearance.</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: "#D8D1C8", true: "#f97316" }}
                                thumbColor={isDark ? "#F6F1EC" : "#FFFFFF"}
                                ios_backgroundColor="#D8D1C8"
                            />
                        </View>

                        <View className="h-px bg-sand-deep/30 mb-4" />

                        {/* Keep Awake Switch */}
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1 pr-4">
                                <Text className="text-base font-medium text-ink">Keep Screen Awake</Text>
                                <Text className="text-sm text-muted mt-1">Prevent screen from sleeping while practicing.</Text>
                            </View>
                            <Switch
                                value={isKeepAwake}
                                onValueChange={toggleKeepAwake}
                                trackColor={{ false: "#D8D1C8", true: "#f97316" }}
                                thumbColor={isKeepAwake ? "#F6F1EC" : "#FFFFFF"}
                                ios_backgroundColor="#D8D1C8"
                            />
                        </View>
                    </View>

                    {/* --- 2. REMOVE ADS CARD --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-lg font-semibold text-ink">Ads Free Version</Text>
                            {isPremium && <Text className="text-sm font-semibold text-brand">Purchased</Text>}
                        </View>

                        <Text className="mt-2 text-sm text-muted">
                            {isPremium
                                ? "You have successfully removed all banner and popup ads from the app."
                                : "Remove banner and popup ads forever with a simple one-time purchase."}
                        </Text>

                        {!isPremium && (
                            <View className="mt-4">
                                <Button label="Remove Ads" variant="secondary" onPress={handleRemoveAdsPress} />
                            </View>
                        )}
                    </View>

                    {/* --- 3. ACCOUNT CARD --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
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
                                        onPress={handleLogoutPress}
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
                                    Create an account to save your custom routines, track your progress, and back up your data.
                                </Text>
                                <View className="mt-4 flex-row justify-between gap-3">
                                    <View className="flex-1">
                                        <Button label="Log In" variant="secondary" onPress={() => router.push("/(auth)/login")} />
                                    </View>
                                    <View className="flex-1">
                                        <Button label="Sign Up" variant="secondary" onPress={() => router.push("/(auth)/signup")} />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* --- 4. LEGAL SECTION --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
                        <Text className="text-lg font-semibold text-ink">Legal</Text>
                        <Text className="mt-2 text-sm text-muted">
                            Read our terms of service and privacy policy to understand how we protect your data.
                        </Text>
                        <View className="mt-4 flex-row justify-between gap-3">
                            <View className="flex-1">
                                <Button label="Terms" variant="secondary" onPress={() => openLegalWebView("https://7pranayama.com/terms", "Terms of Service")} />
                            </View>
                            <View className="flex-1">
                                <Button label="Privacy" variant="secondary" onPress={() => openLegalWebView("https://7pranayama.com/privacy", "Privacy Policy")} />
                            </View>
                        </View>
                    </View>

                    {/* --- 5. DANGER ZONE --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-red-500/30">
                        <Text className="text-lg font-semibold text-red-500">Danger Zone</Text>
                        <Text className="mt-2 text-sm text-muted">
                            Permanently delete your account and wipe all associated data. This action cannot be recovered.
                        </Text>
                        <View className="mt-4">
                            <TouchableOpacity
                                onPress={handleDeletePress}
                                disabled={isDeleting}
                                className={`w-full h-14 rounded-full items-center justify-center border border-red-500/50 ${isDeleting ? 'opacity-50' : ''}`}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator color="#ef4444" size="small" />
                                ) : (
                                    <Text className="font-semibold text-red-500">Delete Account</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

                {/* --- LEGAL WEBVIEW MODAL --- */}
                <Modal visible={legalModalVisible} animationType="slide" onRequestClose={() => setLegalModalVisible(false)}>
                    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'bottom']}>
                        <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <TouchableOpacity onPress={() => setLegalModalVisible(false)} className="p-1">
                                <MaterialIcons name="close" size={28} color="#f97316" />
                            </TouchableOpacity>
                            <Text className="text-lg font-bold text-black dark:text-white">{legalTitle}</Text>
                            <View className="w-7" />
                        </View>
                        <View className="flex-1 bg-white dark:bg-zinc-950">
                            {isLegalLoading && (
                                <View className="absolute inset-0 items-center justify-center z-10 bg-white dark:bg-zinc-950">
                                    <ActivityIndicator size="large" color="#f97316" />
                                </View>
                            )}
                            <WebView source={{ uri: legalUrl }} onLoadEnd={() => setIsLegalLoading(false)} injectedJavaScript={hideHeaderScript} javaScriptEnabled={true} showsVerticalScrollIndicator={false} className="flex-1" />
                        </View>
                    </SafeAreaView>
                </Modal>

                <AdBanner />
            </SafeAreaView>
        </Screen>
    );
}