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
import { MaterialIcons, Feather, AntDesign, FontAwesome5 } from "@expo/vector-icons";
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
        <Screen className="bg-slate-50 dark:bg-[#0A0A0A]">
            <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'top']}>

                {/* Custom Styled Header */}
                <View className="flex-row items-center px-5 pt-2 pb-4">
                    <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
                        <MaterialIcons name="arrow-back" size={26} color="#F6F1EC" className="text-slate-900 dark:text-white" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-black text-slate-900 dark:text-white ml-4">{t("settings")}</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

                    {/* --- 1. PREFERENCES CARD --- */}
                    <View className="mb-4 rounded-3xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-orange-500/10 rounded-xl mr-3">
                                <Feather name="settings" size={18} color="#f97316" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-slate-900 dark:text-white">{t("preferences")}</Text>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{t("preferences_sub")}</Text>
                            </View>
                        </View>

                        {/* Dark Mode Row */}
                        <View className="flex-row items-center justify-between mb-4 pl-11">
                            <View className="flex-1 pr-4">
                                <Text className="text-sm font-bold text-slate-900 dark:text-white">{t("dark_mode")}</Text>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{t("dark_mode_sub") || "Change the app's appearance."}</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: "#D8D1C8", true: "#f97316" }}
                                thumbColor={isDark ? "#FFFFFF" : "#FFFFFF"}
                                ios_backgroundColor="#D8D1C8"
                            />
                        </View>

                        {/* Keep Awake Row */}
                        <View className="flex-row items-center justify-between mb-4 pl-11">
                            <View className="flex-1 pr-4">
                                <Text className="text-sm font-bold text-slate-900 dark:text-white">{t("keep_awake")}</Text>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{t("keep_awake_sub") || "Prevent screen from sleeping while practicing."}</Text>
                            </View>
                            <Switch
                                value={isKeepAwake}
                                onValueChange={toggleKeepAwake}
                                trackColor={{ false: "#D8D1C8", true: "#f97316" }}
                                thumbColor={isKeepAwake ? "#FFFFFF" : "#FFFFFF"}
                                ios_backgroundColor="#D8D1C8"
                            />
                        </View>

                        {/* Language Row */}
                        <TouchableOpacity
                            className="flex-row items-center justify-between pl-11"
                            onPress={() => setLanguageModalVisible(true)}
                        >
                            <View className="flex-1 pr-4">
                                <Text className="text-sm font-bold text-slate-900 dark:text-white">{t("language")}</Text>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{t("language_sub") || "Change app language"}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-sm text-orange-500 font-bold mr-1">
                                    {LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}
                                </Text>
                                <MaterialIcons name="chevron-right" size={20} color="#f97316" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* --- 2. REMINDERS CARD --- */}
                    <View className="mb-4 rounded-3xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-orange-500/10 rounded-xl mr-3">
                                <Feather name="bell" size={18} color="#f97316" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-slate-900 dark:text-white">{t("reminders")}</Text>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{t("reminders_sub") || "Update your preferred daily practice time."}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                router.push({
                                    pathname: "/onboarding",
                                    params: { mode: "edit_notification" }
                                });
                            }}
                            className="flex-row items-center justify-center border border-orange-500/40 rounded-2xl py-3.5 bg-transparent ml-11"
                        >
                            <MaterialIcons name="calendar-today" size={16} color="#f97316" style={{ marginRight: 8 }} />
                            <Text className="text-orange-500 font-bold text-sm" numberOfLines={1}>{t("reminders_btn") || "Edit Reminder Time"}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* --- 3. ADS FREE VERSION CARD --- */}
                    <View className="mb-4 rounded-3xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-orange-500/10 rounded-xl mr-3">
                                <FontAwesome5 name="gem" size={16} color="#f97316" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base font-bold text-slate-900 dark:text-white">{t("ads_free") || "Ads Free Version"}</Text>
                                    {isPremium && <Text className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">{t("purchased")}</Text>}
                                </View>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                    {isPremium ? t("purchased_sub") : (t("ads_free_sub") || "Remove banner and popup ads forever with a simple one-time purchase.")}
                                </Text>
                            </View>
                        </View>

                        {!isPremium && (
                            <TouchableOpacity
                                onPress={handleRemoveAdsPress}
                                className="flex-row items-center justify-center border border-orange-500/40 rounded-2xl py-3.5 bg-transparent ml-11"
                            >
                                <MaterialIcons name="ad-units" size={16} color="#f97316" style={{ marginRight: 8 }} />
                                <Text className="text-orange-500 font-bold text-sm" numberOfLines={1}>{t("remove_ads") || "Remove Ads"}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* --- 4. ACCOUNT CARD --- */}
                    <View className="mb-4 rounded-3xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-orange-500/10 rounded-xl mr-3">
                                <Feather name="user" size={18} color="#f97316" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base font-bold text-slate-900 dark:text-white">{t("account")}</Text>
                                    <Text className="text-xs font-bold text-slate-400 dark:text-gray-400">{isLoggedIn ? t("logedin") : (t("guest") || "Guest")}</Text>
                                </View>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                    {isLoggedIn
                                        ? `${t("namaste")}, ${userName || t("yogi")}. ${t("yogi_sub")}`
                                        : (t("guest_sub") || "Create an account to save your custom routines, track your progress, and back up your data.")
                                    }
                                </Text>
                            </View>
                        </View>

                        <View className="ml-11">
                            {isLoggedIn ? (
                                <TouchableOpacity
                                    onPress={handleLogoutPress}
                                    disabled={isLoggingOut}
                                    className="flex-row items-center justify-center border border-orange-500/40 rounded-2xl py-3.5 bg-transparent"
                                >
                                    <MaterialIcons name="logout" size={16} color="#f97316" style={{ marginRight: 8 }} />
                                    <Text className="text-orange-500 font-bold text-sm" numberOfLines={1}>
                                        {isLoggingOut ? t("logouting") : t("logout")}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={() => router.push("/(auth)/login")}
                                        className="flex-1 flex-row items-center justify-center border border-orange-500/40 rounded-2xl py-3.5 bg-transparent"
                                    >
                                        <MaterialIcons name="login" size={16} color="#f97316" style={{ marginRight: 6 }} />
                                        <Text className="text-orange-500 font-bold text-sm" numberOfLines={1}>{t("login")}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => router.push("/(auth)/signup")}
                                        className="flex-1 flex-row items-center justify-center border border-orange-500/40 rounded-2xl py-3.5 bg-transparent"
                                    >
                                        <Feather name="user-plus" size={15} color="#f97316" style={{ marginRight: 6 }} />
                                        <Text className="text-orange-500 font-bold text-sm" numberOfLines={1}>{t("sign_up")}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* --- 5. LEGAL CARD --- */}
                    <View className="mb-4 rounded-3xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-gray-800 p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-orange-500/10 rounded-xl mr-3">
                                <Feather name="shield" size={18} color="#f97316" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-slate-900 dark:text-white">{t("legal")}</Text>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                    {t("legal_sub") || "Read our terms of service and privacy policy to understand how we protect your data."}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3 ml-11">
                            <TouchableOpacity
                                onPress={() => openLegalWebView("https://7pranayama.com/terms", "Terms of Service")}
                                className="flex-1 flex-row items-center justify-center border border-orange-500/40 rounded-2xl py-3.5 bg-transparent"
                            >
                                <MaterialIcons name="description" size={16} color="#f97316" style={{ marginRight: 6 }} />
                                <Text className="text-orange-500 font-bold text-sm">{t("terms")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => openLegalWebView("https://7pranayama.com/privacy", "Privacy Policy")}
                                className="flex-1 flex-row items-center justify-center border border-orange-500/40 rounded-2xl py-3.5 bg-transparent"
                            >
                                <Feather name="lock" size={15} color="#f97316" style={{ marginRight: 6 }} />
                                <Text className="text-orange-500 font-bold text-sm">{t("privacy")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* --- 6. DANGER ZONE --- */}
                    <View className="mb-4 rounded-3xl bg-white dark:bg-[#1A1A1A] border border-red-500/20 p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-red-500/10 rounded-xl mr-3">
                                <AntDesign name="warning" size={18} color="#ef4444" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-red-500">{t("danger_zone")}</Text>
                                <Text className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                    {t("danger_zone_sub") || "Permanently delete your account and wipe all associated data. This action cannot be recovered."}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleDeletePress}
                            disabled={isDeleting}
                            className="flex-row items-center justify-center border border-red-500/40 rounded-2xl py-3.5 bg-transparent ml-11"
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="#ef4444" size="small" />
                            ) : (
                                <>
                                    <Feather name="trash-2" size={16} color="#ef4444" style={{ marginRight: 8 }} />
                                    <Text className="text-red-500 font-bold text-sm" numberOfLines={1}>{t("delete_account")}</Text>
                                </>
                            )}
                        </TouchableOpacity>
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
                            className="bg-white dark:bg-[#1A1A1A] rounded-t-3xl px-5"
                            style={{ paddingBottom: insets.bottom }}
                        >
                            <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full self-center mb-6 mt-3" />

                            <View className="flex-row items-center justify-between mb-5">
                                <Text className="text-xl font-bold text-slate-900 dark:text-white">{t("select_language")}</Text>
                                <TouchableOpacity
                                    onPress={() => setLanguageModalVisible(false)}
                                    className="p-2 bg-slate-100 dark:bg-gray-800 rounded-full"
                                >
                                    <MaterialIcons name="close" size={20} color="#f97316" />
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
                                        <Text className={`text-base ${isSelected ? 'font-bold text-orange-500' : 'text-slate-900 dark:text-white font-medium'}`}>
                                            {lang.label}
                                        </Text>
                                        {isSelected && (
                                            <View className="bg-orange-500 rounded-full p-1">
                                                <MaterialIcons name="check" size={14} color="#FFF" />
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
                    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'bottom']}>
                        <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <TouchableOpacity onPress={() => setLegalModalVisible(false)} className="p-1">
                                <MaterialIcons name="close" size={26} color="#f97316" />
                            </TouchableOpacity>
                            <Text className="text-lg font-bold text-slate-900 dark:text-white">{legalTitle}</Text>
                            <View className="w-7" />
                        </View>
                        <View className="flex-1 bg-white dark:bg-[#0A0A0A]">
                            {isLegalLoading && (
                                <View className="absolute inset-0 items-center justify-center z-10 bg-white dark:bg-[#0A0A0A]">
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