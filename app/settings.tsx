import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Switch, DeviceEventEmitter, Alert } from "react-native";
import { Screen } from "@/components/ui";
import { Button, SectionTitle } from "@/components/ui";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useEffect } from "react";
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
import { useAudioPlayer } from "expo-audio";
import {
    DEFAULT_PRACTICE_MUSIC,
    isPracticeMusicId,
    PRACTICE_MUSIC_OPTIONS,
    PRACTICE_MUSIC_STORAGE_KEY,
    PracticeMusicId,
} from "@/audio/music";
import { ReminderModal } from "@/components/settings/ReminderModal";

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
    const headerIconColor = isDark ? "#F6F1EC" : "#0F172A";
    const [isKeepAwake, setIsKeepAwake] = useState(true);

    const [languageModalVisible, setLanguageModalVisible] = useState(false);
    const [musicModalVisible, setMusicModalVisible] = useState(false);
    const [practiceMusic, setPracticeMusic] = useState<PracticeMusicId>(DEFAULT_PRACTICE_MUSIC);
    const [previewMusicId, setPreviewMusicId] = useState<PracticeMusicId | null>(null);

    const [reminderModalVisible, setReminderModalVisible] = useState(false);

    // --- LEGAL WEBVIEW STATES ---
    const [legalModalVisible, setLegalModalVisible] = useState(false);
    const [legalUrl, setLegalUrl] = useState("");
    const [legalTitle, setLegalTitle] = useState("");
    const [isLegalLoading, setIsLegalLoading] = useState(true);
    const previewMusic = PRACTICE_MUSIC_OPTIONS.find((option) => option.id === previewMusicId) ?? PRACTICE_MUSIC_OPTIONS[0];
    const previewPlayer = useAudioPlayer(previewMusic.source);

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

                    const savedPracticeMusic = await AsyncStorage.getItem(PRACTICE_MUSIC_STORAGE_KEY);
                    setPracticeMusic(isPracticeMusicId(savedPracticeMusic) ? savedPracticeMusic : DEFAULT_PRACTICE_MUSIC);
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

    const changePracticeMusic = async (musicId: PracticeMusicId) => {
        setPracticeMusic(musicId);
        await AsyncStorage.setItem(PRACTICE_MUSIC_STORAGE_KEY, musicId);
    };

    const toggleMusicPreview = (musicId: PracticeMusicId) => {
        if (musicId === "off") {
            setPreviewMusicId(null);
            previewPlayer.pause();
            void previewPlayer.seekTo(0);
            return;
        }

        setPreviewMusicId((current) => current === musicId ? null : musicId);
    };

    useEffect(() => {
        previewPlayer.loop = false;
        previewPlayer.volume = 0.35;
    }, [previewPlayer]);

    useEffect(() => {
        if (!previewMusicId || previewMusicId === "off") {
            previewPlayer.pause();
            void previewPlayer.seekTo(0);
            return;
        }

        let cancelled = false;
        const timeout = setTimeout(() => {
            previewPlayer.pause();
            void previewPlayer.seekTo(0);
            setPreviewMusicId(null);
        }, 6000);

        void previewPlayer.seekTo(0).then(() => {
            if (!cancelled) previewPlayer.play();
        });

        return () => {
            cancelled = true;
            clearTimeout(timeout);
            previewPlayer.pause();
        };
    }, [previewMusicId, previewPlayer]);

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

    const handleBackPress = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)");
        }
    };

    return (
        <Screen className="bg-sand">
            <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'top']}>

                {/* Custom Styled Header */}
                <View className="flex-row items-center px-5 pt-2 pb-4">
                    <TouchableOpacity
                        onPress={handleBackPress}
                        className="p-2 -ml-2 rounded-full active:opacity-70"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="arrow-back" size={26} color={headerIconColor} />
                    </TouchableOpacity>
                    <Text className="text-2xl font-semibold text-ink ml-3">{t("settings")}</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

                    {/* --- 1. PREFERENCES CARD --- */}
                    <View className="mb-4 rounded-[28px] bg-surface border border-surface-light p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-brand/10 rounded-xl mr-3">
                                <Feather name="settings" size={18} color="#FF9500" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-ink">{t("preferences")}</Text>
                                <Text className="text-xs text-muted mt-0.5">{t("preferences_sub")}</Text>
                            </View>
                        </View>

                        {/* Dark Mode Row */}
                        <View className="flex-row items-center justify-between mb-4 pl-11">
                            <View className="flex-1 pr-4">
                                <Text className="text-sm font-bold text-ink">{t("dark_mode")}</Text>
                                <Text className="text-xs text-muted mt-0.5">{t("dark_mode_sub") || "Change the app's appearance."}</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: "#D1D1D6", true: "#FF9500" }}
                                thumbColor={isDark ? "#FFFFFF" : "#FFFFFF"}
                                ios_backgroundColor="#D1D1D6"
                            />
                        </View>

                        {/* Keep Awake Row */}
                        <View className="flex-row items-center justify-between mb-4 pl-11">
                            <View className="flex-1 pr-4">
                                <Text className="text-sm font-bold text-ink">{t("keep_awake")}</Text>
                                <Text className="text-xs text-muted mt-0.5">{t("keep_awake_sub") || "Prevent screen from sleeping while practicing."}</Text>
                            </View>
                            <Switch
                                value={isKeepAwake}
                                onValueChange={toggleKeepAwake}
                                trackColor={{ false: "#D1D1D6", true: "#FF9500" }}
                                thumbColor={isKeepAwake ? "#FFFFFF" : "#FFFFFF"}
                                ios_backgroundColor="#D1D1D6"
                            />
                        </View>

                        {/* Language Row */}
                        <TouchableOpacity
                            className="flex-row items-center justify-between pl-11"
                            onPress={() => setLanguageModalVisible(true)}
                        >
                            <View className="flex-1 pr-4">
                                <Text className="text-sm font-bold text-ink">{t("language")}</Text>
                                <Text className="text-xs text-muted mt-0.5">{t("language_sub") || "Change app language"}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-sm text-brand font-bold mr-1">
                                    {LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}
                                </Text>
                                <MaterialIcons name="chevron-right" size={20} color="#FF9500" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* --- MUSIC CARD --- */}
                    <View className="mb-4 rounded-[28px] bg-surface border border-surface-light p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-brand/10 rounded-xl mr-3">
                                <Feather name="music" size={18} color="#FF9500" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-ink">{t("practice_music") || "Practice Music"}</Text>
                                <Text className="text-xs text-muted mt-0.5">{t("practice_music_sub") || "Choose background music that plays during your practice sessions."}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            className="flex-row items-center justify-between pl-11"
                            onPress={() => setMusicModalVisible(true)}
                        >
                            <View className="flex-1 pr-4">
                                <Text className="text-sm font-bold text-ink">
                                    {PRACTICE_MUSIC_OPTIONS.find((o) => o.id === practiceMusic)?.label || "Meditation"}
                                </Text>
                                <Text className="text-xs text-muted mt-0.5">
                                    {PRACTICE_MUSIC_OPTIONS.find((o) => o.id === practiceMusic)?.description || ""}
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#FF9500" />
                        </TouchableOpacity>
                    </View>

                    {/* --- 2. REMINDERS CARD --- */}
                    <View className="mb-4 rounded-[28px] bg-surface border border-surface-light p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-brand/10 rounded-xl mr-3">
                                <Feather name="bell" size={18} color="#FF9500" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-ink">{t("reminders")}</Text>
                                <Text className="text-xs text-muted mt-0.5">{t("reminders_sub") || "Update your preferred daily practice time."}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            className="flex-row items-center justify-between pl-11"
                            onPress={() => setReminderModalVisible(true)}
                        >
                            <View className="flex-1 pr-4">
                                <Text className="text-sm font-bold text-ink">
                                    {t("reminder_time") || "Daily Practice Time"}
                                </Text>
                                <Text className="text-xs text-muted mt-0.5">
                                    {t("tap_to_change_time") || "Tap to modify your notification schedule"}
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#FF9500" />
                        </TouchableOpacity>
                    </View>

                    {/* --- 3. ADS FREE VERSION CARD --- */}
                    <View className="mb-4 rounded-[28px] bg-surface border border-surface-light p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-brand/10 rounded-xl mr-3">
                                <FontAwesome5 name="gem" size={16} color="#FF9500" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base font-bold text-ink">{t("ads_free") || "Ads Free Version"}</Text>
                                    {isPremium && <Text className="text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">{t("purchased")}</Text>}
                                </View>
                                <Text className="text-xs text-muted mt-0.5">
                                    {isPremium ? t("purchased_sub") : (t("ads_free_sub") || "Remove banner and popup ads forever with a simple one-time purchase.")}
                                </Text>
                            </View>
                        </View>

                        {!isPremium && (
                            <TouchableOpacity
                                onPress={handleRemoveAdsPress}
                                className="flex-row items-center justify-center border border-brand/40 rounded-2xl py-3.5 bg-transparent ml-11"
                            >
                                <MaterialIcons name="ad-units" size={16} color="#FF9500" style={{ marginRight: 8 }} />
                                <Text className="text-brand font-bold text-sm" numberOfLines={1}>{t("remove_ads") || "Remove Ads"}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* --- 4. ACCOUNT CARD --- */}
                    <View className="mb-4 rounded-[28px] bg-surface border border-surface-light p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-brand/10 rounded-xl mr-3">
                                <Feather name="user" size={18} color="#FF9500" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base font-bold text-ink">{t("account")}</Text>
                                    <Text className="text-xs font-bold text-slate-400 dark:text-gray-400">{isLoggedIn ? t("logedin") : (t("guest") || "Guest")}</Text>
                                </View>
                                <Text className="text-xs text-muted mt-0.5">
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
                                    className="flex-row items-center justify-center border border-brand/40 rounded-2xl py-3.5 bg-transparent"
                                >
                                    <MaterialIcons name="logout" size={16} color="#FF9500" style={{ marginRight: 8 }} />
                                    <Text className="text-brand font-bold text-sm" numberOfLines={1}>
                                        {isLoggingOut ? t("logouting") : t("logout")}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={() => router.push("/(auth)/login")}
                                        className="flex-1 flex-row items-center justify-center border border-brand/40 rounded-2xl py-3.5 bg-transparent"
                                    >
                                        <MaterialIcons name="login" size={16} color="#FF9500" style={{ marginRight: 6 }} />
                                        <Text className="text-brand font-bold text-sm" numberOfLines={1}>{t("login")}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => router.push("/(auth)/signup")}
                                        className="flex-1 flex-row items-center justify-center border border-brand/40 rounded-2xl py-3.5 bg-transparent"
                                    >
                                        <Feather name="user-plus" size={15} color="#FF9500" style={{ marginRight: 6 }} />
                                        <Text className="text-brand font-bold text-sm" numberOfLines={1}>{t("sign_up")}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* --- 5. LEGAL CARD --- */}
                    <View className="mb-4 rounded-[28px] bg-surface border border-surface-light p-5">
                        <View className="flex-row items-start mb-5">
                            <View className="p-2 bg-brand/10 rounded-xl mr-3">
                                <Feather name="shield" size={18} color="#FF9500" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-ink">{t("legal")}</Text>
                                <Text className="text-xs text-muted mt-0.5">
                                    {t("legal_sub") || "Read our terms of service and privacy policy to understand how we protect your data."}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3 ml-11">
                            <TouchableOpacity
                                onPress={() => openLegalWebView("https://7pranayama.com/terms", "Terms of Service")}
                                className="flex-1 flex-row items-center justify-center border border-brand/40 rounded-2xl py-3.5 bg-transparent"
                            >
                                <MaterialIcons name="description" size={16} color="#FF9500" style={{ marginRight: 6 }} />
                                <Text className="text-brand font-bold text-sm">{t("terms")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => openLegalWebView("https://7pranayama.com/privacy", "Privacy Policy")}
                                className="flex-1 flex-row items-center justify-center border border-brand/40 rounded-2xl py-3.5 bg-transparent"
                            >
                                <Feather name="lock" size={15} color="#FF9500" style={{ marginRight: 6 }} />
                                <Text className="text-brand font-bold text-sm">{t("privacy")}</Text>
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
                                <Text className="text-xs text-muted mt-0.5">
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
                            className="bg-surface rounded-t-[28px] px-5"
                            style={{ paddingBottom: insets.bottom, maxHeight: "80%" }}
                        >
                            <View className="w-12 h-1.5 bg-surface-light rounded-full self-center mb-6 mt-3" />

                            <View className="flex-row items-center justify-between mb-5">
                                <Text className="text-xl font-bold text-ink">{t("select_language")}</Text>
                                <TouchableOpacity
                                    onPress={() => setLanguageModalVisible(false)}
                                    className="p-2 bg-sand rounded-full"
                                >
                                    <MaterialIcons name="close" size={20} color="#FF9500" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 16 }}
                            >
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
                                                    <MaterialIcons name="check" size={14} color="#FFF" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* --- MUSIC SELECTION MODAL --- */}
                <Modal
                    visible={musicModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => {
                        setMusicModalVisible(false);
                        setPreviewMusicId(null);
                        previewPlayer.pause();
                        void previewPlayer.seekTo(0);
                    }}
                >
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                        activeOpacity={1}
                        onPress={() => {
                            setMusicModalVisible(false);
                            setPreviewMusicId(null);
                            previewPlayer.pause();
                            void previewPlayer.seekTo(0);
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            className="bg-surface rounded-t-[28px] px-5"
                            style={{ paddingBottom: insets.bottom, maxHeight: "80%" }}
                        >
                            <View className="w-12 h-1.5 bg-surface-light rounded-full self-center mb-6 mt-3" />

                            <View className="flex-row items-center justify-between mb-5">
                                <Text className="text-xl font-bold text-ink">{t("select_music") || "Select Practice Music"}</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setMusicModalVisible(false);
                                        setPreviewMusicId(null);
                                        previewPlayer.pause();
                                        void previewPlayer.seekTo(0);
                                    }}
                                    className="p-2 bg-sand rounded-full"
                                >
                                    <MaterialIcons name="close" size={20} color="#FF9500" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 16 }}
                            >
                                {PRACTICE_MUSIC_OPTIONS.map((option) => {
                                    const isSelected = practiceMusic === option.id;
                                    const isPreviewing = previewMusicId === option.id;
                                    const isOff = option.id === "off";

                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            onPress={() => {
                                                changePracticeMusic(option.id);
                                                setMusicModalVisible(false);
                                                setPreviewMusicId(null);
                                                previewPlayer.pause();
                                                void previewPlayer.seekTo(0);
                                            }}
                                            className={`p-4 rounded-2xl mb-3 border ${isSelected ? 'bg-brand/10 border-brand' : 'bg-sand border-transparent'}`}
                                        >
                                            <View className="flex-row justify-between items-center">
                                                <View className="flex-1 pr-3">
                                                    <Text className={`text-base ${isSelected ? 'font-bold text-brand' : 'text-ink font-medium'}`}>
                                                        {option.id === "off" ? (t("no_music") || "No Music") : option.label}
                                                    </Text>
                                                    <Text className="text-xs text-muted mt-0.5">
                                                        {option.id === "off" ? (t("no_music_desc") || "Practice with timer bell only") : option.description}
                                                    </Text>
                                                </View>

                                                <View className="flex-row items-center gap-2">
                                                    {!isOff && (
                                                        <TouchableOpacity
                                                            onPress={(e) => {
                                                                e.stopPropagation?.();
                                                                toggleMusicPreview(option.id);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full border ${isPreviewing ? 'bg-brand border-brand' : 'bg-transparent border-brand/40'}`}
                                                        >
                                                            <Text className={`text-xs font-bold ${isPreviewing ? 'text-white' : 'text-brand'}`}>
                                                                {isPreviewing ? (t("stop_preview") || "Stop") : (t("preview") || "Preview")}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {isSelected && (
                                                        <View className="bg-brand rounded-full p-1">
                                                            <MaterialIcons name="check" size={14} color="#FFF" />
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* --- LEGAL WEBVIEW MODAL --- */}
                <Modal visible={legalModalVisible} animationType="slide" onRequestClose={() => setLegalModalVisible(false)}>
                    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'bottom']}>
                        <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <TouchableOpacity onPress={() => setLegalModalVisible(false)} className="p-1">
                                <MaterialIcons name="close" size={26} color="#FF9500" />
                            </TouchableOpacity>
                            <Text className="text-lg font-bold text-ink">{legalTitle}</Text>
                            <View className="w-7" />
                        </View>
                        <View className="flex-1 bg-white dark:bg-[#0A0A0A]">
                            {isLegalLoading && (
                                <View className="absolute inset-0 items-center justify-center z-10 bg-white dark:bg-[#0A0A0A]">
                                    <ActivityIndicator size="large" color="#FF9500" />
                                </View>
                            )}
                            <WebView source={{ uri: legalUrl }} onLoadEnd={() => setIsLegalLoading(false)} injectedJavaScript={hideHeaderScript} javaScriptEnabled={true} showsVerticalScrollIndicator={false} className="flex-1" />
                        </View>
                    </SafeAreaView>
                </Modal>

                <ReminderModal
                    visible={reminderModalVisible}
                    onClose={() => setReminderModalVisible(false)}
                />

                <AdBanner />
            </SafeAreaView>
        </Screen>
    );
}
