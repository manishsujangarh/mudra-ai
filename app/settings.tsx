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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../src/i18n";

export default function Settings() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
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

    const [languageModalVisible, setLanguageModalVisible] = useState(false);

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

    const changeLanguage = async (langCode: string) => {
        await AsyncStorage.setItem('language', langCode);
        i18n.changeLanguage(langCode);
        setLanguageModalVisible(false);
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
                t("login_required"),
                t("login_required_sub"),
                [
                    { text: t("cancel"), style: "cancel" },
                    { text: t("login"), onPress: () => router.push("/(auth)/login") }
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
            t("logout"),
            t("logout_sub"),
            [
                { text: t("cancel"), style: "cancel" },
                { text: t("logout"), style: "destructive", onPress: processLogout }
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
                t("success"),
                t("removed_sub"),
                [
                    {
                        text: t("ok"), onPress: async () => {
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
            ? t("delete_cloud")
            : t("delete_local");

        Alert.alert(
            t("delete_account"),
            message,
            [
                { text: t("cancel"), style: "cancel" },
                { text: t("delete_account"), style: "destructive", onPress: processDeleteAccount }
            ]
        );
    };

    return (
        <Screen>
            <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 pb-10">

                    <SectionTitle>{t("settings")}</SectionTitle>

                    {/* --- 1. PREFERENCES CARD (NEW) --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
                        <Text className="text-lg font-semibold text-ink mb-4">{t("preferences")}</Text>

                        {/* Theme Switch */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-1 pr-4">
                                <Text className="text-base font-medium text-ink">{t("dark_mode")}</Text>
                                <Text className="text-sm text-muted mt-1">{t("dark_mode_sub")}</Text>
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
                                <Text className="text-base font-medium text-ink">{t("keep_awake")}</Text>
                                <Text className="text-sm text-muted mt-1">{t("keep_awake_sub")}</Text>
                            </View>
                            <Switch
                                value={isKeepAwake}
                                onValueChange={toggleKeepAwake}
                                trackColor={{ false: "#D8D1C8", true: "#f97316" }}
                                thumbColor={isKeepAwake ? "#F6F1EC" : "#FFFFFF"}
                                ios_backgroundColor="#D8D1C8"
                            />
                        </View>
                        <View className="h-px bg-sand-deep/30 mb-4" />
                        <TouchableOpacity
                            className="flex-row items-center justify-between"
                            onPress={() => setLanguageModalVisible(true)}
                        >
                            <View className="flex-1 pr-4">
                                <Text className="text-base font-medium text-ink">{t("language")}</Text>
                                <Text className="text-sm text-muted mt-1">{t("language_sub")}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-base text-brand font-medium mr-1">
                                    {LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}
                                </Text>
                                <MaterialIcons name="chevron-right" size={24} color="#9AA8A4" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* --- REMINDER SETTINGS CARD --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
                        <Text className="text-lg font-semibold text-ink">{t("reminders")}</Text>
                        <Text className="mt-2 text-sm text-muted">
                            {t("reminders_sub")}
                        </Text>
                        <View className="mt-4">
                            <Button
                                label={t("reminders_btn")}
                                variant="secondary"
                                onPress={() => {
                                    router.push({
                                        pathname: "/onboarding",
                                        params: { mode: "edit_notification" }
                                    });
                                }}
                            />
                        </View>
                    </View>

                    {/* --- 2. REMOVE ADS CARD --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-lg font-semibold text-ink" numberOfLines={1}>{t("ads_free")}</Text>
                            {isPremium && <Text className="text-sm font-semibold text-brand">{t("purchased")}</Text>}
                        </View>

                        <Text className="mt-2 text-sm text-muted">
                            {isPremium
                                ? t("purchased_sub")
                                : t("ads_free_sub")
                            }
                        </Text>

                        {!isPremium && (
                            <View className="mt-4">
                                <Button label={t("remove_ads")} variant="secondary" onPress={handleRemoveAdsPress} />
                            </View>
                        )}
                    </View>

                    {/* --- 3. ACCOUNT CARD --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
                        {isLoggedIn ? (
                            <>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-lg font-semibold text-ink">{t("account")}</Text>
                                    <Text className="text-sm font-semibold text-brand">{t("logedin")}</Text>
                                </View>
                                <Text className="mt-2 text-sm text-muted">
                                    {t("namaste")}, {userName || t("yogi")}. {t("yogi_sub")}
                                </Text>
                                <View className="mt-4">
                                    <Button
                                        label={isLoggingOut ? t("logouting") : t("logout")}
                                        variant="secondary"
                                        onPress={handleLogoutPress}
                                        disabled={isLoggingOut}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-lg font-semibold text-ink">{t("account")}</Text>
                                    <Text className="text-sm font-semibold text-muted">{t("guest")}</Text>
                                </View>
                                <Text className="mt-2 text-sm text-muted">
                                    {t("guest_sub")}
                                </Text>
                                <View className="mt-4 flex-row justify-between gap-3">
                                    <View className="flex-1">
                                        <Button label={t("login")} variant="secondary" onPress={() => router.push("/(auth)/login")} />
                                    </View>
                                    <View className="flex-1">
                                        <Button label={t("sign_up")} variant="secondary" onPress={() => router.push("/(auth)/signup")} />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* --- 4. LEGAL SECTION --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-sand-deep/20">
                        <Text className="text-lg font-semibold text-ink">{t("legal")}</Text>
                        <Text className="mt-2 text-sm text-muted">
                            {t("legal_sub")}
                        </Text>
                        <View className="mt-4 flex-row justify-between gap-3">
                            <View className="flex-1">
                                <Button label={t("terms")} variant="secondary" onPress={() => openLegalWebView("https://7pranayama.com/terms", "Terms of Service")} />
                            </View>
                            <View className="flex-1">
                                <Button label={t("privacy")} variant="secondary" onPress={() => openLegalWebView("https://7pranayama.com/privacy", "Privacy Policy")} />
                            </View>
                        </View>
                    </View>

                    {/* --- 5. DANGER ZONE --- */}
                    <View className="mt-4 rounded-3xl bg-surface p-5 border border-red-500/30">
                        <Text className="text-lg font-semibold text-red-500">{t("danger_zone")}</Text>
                        <Text className="mt-2 text-sm text-muted">
                            {t("danger_zone_sub")}
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
                                    <Text className="font-semibold text-red-500">{t("delete_account")}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

                <Modal
                    visible={languageModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setLanguageModalVisible(false)}
                >
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                        activeOpacity={1}
                        onPress={() => setLanguageModalVisible(false)}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            className="bg-surface rounded-t-3xl px-5"
                            style={{ paddingBottom: insets.bottom }}
                        >
                            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />

                            <View className="flex-row items-center justify-between mb-5">
                                <Text className="text-xl font-bold text-ink">{t("select_language")}</Text>
                                <TouchableOpacity
                                    onPress={() => setLanguageModalVisible(false)}
                                    className="p-2 -mr-2 bg-sand rounded-full"
                                >
                                    <MaterialIcons name="close" size={24} color="#f97316" />
                                </TouchableOpacity>
                            </View>

                            {LANGUAGES.map((lang) => {
                                const isSelected = i18n.language === lang.code;
                                return (
                                    <TouchableOpacity
                                        key={lang.code}
                                        onPress={() => changeLanguage(lang.code)}
                                        className={`p-4 rounded-2xl mb-3 flex-row justify-between items-center border ${isSelected ? 'bg-brand/10 border-brand' : 'bg-sand border-transparent'
                                            }`}
                                    >
                                        <Text className={`text-base ${isSelected ? 'font-bold text-brand' : 'text-ink font-medium'}`}>
                                            {lang.label}
                                        </Text>
                                        {isSelected && (
                                            <View className="bg-brand rounded-full p-1">
                                                <MaterialIcons name="check" size={16} color="#FFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

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