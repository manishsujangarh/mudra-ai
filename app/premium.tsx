import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, DeviceEventEmitter, ScrollView, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome as Icon } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';

import {
    fetchPremiumCatalogFromStore,
    isIapRuntimeAvailable,
    ONE_TIME_SKU,
    purchasePremiumLifetime,
    queryPremiumOwnershipStatus,
    PremiumCatalogItem
} from '../src/utils/iap';
import { useTranslation } from 'react-i18next';

export default function PremiumScreen() {
    const [product, setProduct] = useState<PremiumCatalogItem | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isLoadingPrices, setIsLoadingPrices] = useState(true);

    const { t } = useTranslation();

    // Modals State
    const [legalModalVisible, setLegalModalVisible] = useState(false);
    const [legalUrl, setLegalUrl] = useState('');
    const [legalTitle, setLegalTitle] = useState('');
    const [isLegalLoading, setIsLegalLoading] = useState(true);

    const router = useRouter();
    const isIapAvailable = isIapRuntimeAvailable();
    const canSimulateIap = !isIapAvailable && __DEV__;

    const PREMIUM_STORAGE_KEY = 'mudra_ai_is_premium';

    const savePremiumFlag = async (isPremium: boolean) => {
        await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, isPremium ? 'true' : 'false');
    };

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

    const refreshPremiumStatus = async () => {
        const ownershipStatus = await queryPremiumOwnershipStatus();
        const hasPremium = ownershipStatus?.hasPremium === true;
        await savePremiumFlag(hasPremium);
        return ownershipStatus;
    };

    useEffect(() => {
        const initIAP = async () => {
            try {
                setIsLoadingPrices(true);
                if (isIapAvailable) {
                    const catalog = await fetchPremiumCatalogFromStore();
                    if (catalog.item) {
                        setProduct(catalog.item);
                    }
                    await refreshPremiumStatus();
                }
            } catch (err) {
                console.warn("Error fetching prices: ", err);
            } finally {
                setIsLoadingPrices(false);
            }
        };
        initIAP();
    }, []);

    const handlePurchase = async () => {
        if (isPurchasing) return;

        try {
            const isLogged = await AsyncStorage.getItem('isLogged');
            if (isLogged !== 'true') {
                Alert.alert(
                    t("login_required"),
                    t("login_required_sub"),
                    [{ text: t("login"), onPress: () => router.push('/(auth)/login') }, { text: "Cancel", style: "cancel" }]
                );
                return;
            }

            setIsPurchasing(true);

            const ownershipStatus = await refreshPremiumStatus();
            if (ownershipStatus?.hasPremium) {
                Alert.alert(
                    t('already_purchased'),
                    t('already_purchased_sub'), [
                    { text: t('ok'), onPress: () => router.back() }
                ]);
                return;
            }

            if (canSimulateIap) {
                await savePremiumFlag(true);
                Alert.alert(
                    t('purchased_success'),
                    t('purchased_success_sub'),
                    [
                        { text: t('ok'), onPress: () => router.back() }
                    ]);
                DeviceEventEmitter.emit('PremiumUpdated');
                return;
            }

            const purchaseResult = await purchasePremiumLifetime();

            if (purchaseResult.unavailable) {
                Alert.alert('Unavailable', 'In-app purchases work in real builds, not in the development environment.');
                return;
            }
            if (purchaseResult.cancelled) {
                return;
            }
            if (!purchaseResult.success || !purchaseResult.receiptToken) {
                throw new Error('Purchase failed or receipt missing.');
            }

            // ==========================================
            // 🌟 NAYA CODE: Backend ko verification request bhejein
            // ==========================================
            const verification = await apiFetch('/mudra/verify-purchase', {
                method: 'POST',
                body: JSON.stringify({
                    receipt_token: purchaseResult.receiptToken,
                    product_id: product?.productId || ONE_TIME_SKU,
                    platform: Platform.OS
                })
            });

            if (verification && verification.success) {
                // Backend validation successful hone par hi premium flag save karein
                await savePremiumFlag(true);
                Alert.alert(`${t("congratulations")} 🎉`, t('ads_remove_success'), [
                    { text: t('awesome'), onPress: () => router.back() }
                ]);
                DeviceEventEmitter.emit('PremiumUpdated');
            } else {
                throw new Error(verification.message || 'Receipt validation failed on server.');
            }

        } catch (err: any) {
            console.warn(err);
            Alert.alert('Purchase Failed', err?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        try {
            const isLogged = await AsyncStorage.getItem('isLogged');
            if (isLogged !== 'true') {
                Alert.alert(
                    t("login_required"),
                    t("restore_require"),
                    [
                        { text: t("login"), onPress: () => router.push('/(auth)/login') }, { text: "Cancel", style: "cancel" }
                    ]);
                return;
            }

            setIsPurchasing(true);
            const ownershipStatus = await refreshPremiumStatus();

            if (ownershipStatus?.hasPremium) {
                DeviceEventEmitter.emit('PremiumUpdated');
                Alert.alert(
                    t('success'),
                    t('restore_success')
                );
            } else {
                Alert.alert(
                    t('no_purchase'),
                    t('no_purchase_sub')
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const renderFeatureItem = (text: string) => (
        <View className="flex-row items-center my-2">
            <Icon name="check-circle" size={20} color="#FF9500" className="mr-3" />
            <Text className="font-medium flex-1 text-base text-black dark:text-white">
                {text}
            </Text>
        </View>
    );

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-zinc-950">

            <ScrollView
                contentContainerClassName="pb-10 pt-8 px-6"
                showsVerticalScrollIndicator={false}
            >

                {/* Header Section */}
                <View className="items-center mb-8">
                    <Text className="font-black p-2 text-3xl text-black dark:text-white" numberOfLines={1}>
                        {t("remove")} <Text className="text-brand">{t("ads")}</Text>
                    </Text>
                    <Text className="mt-2 text-base text-gray-500 dark:text-gray-400 text-center">
                        {t("ads_fre")}
                    </Text>
                </View>

                {/* Features Box */}
                <View className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-900 p-5 mb-6">
                    {renderFeatureItem(t('ads_1'))}
                    {renderFeatureItem(t("ads_2"))}
                    {renderFeatureItem(t("ads_3"))}
                    {renderFeatureItem(t("ads_4"))}
                </View>

                {/* Single Plan Card */}
                <View className="border-2 border-brand rounded-2xl p-5 mb-6 bg-brand/5 dark:bg-brand/10">
                    <View className="flex-row justify-between items-center">
                        <Text className="font-extrabold text-xl text-black dark:text-white">{product?.title || t('life_time')}</Text>
                        <View className="bg-brand px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold" numberOfLines={1}>{t("best_value")}</Text>
                        </View>
                    </View>
                    <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("life_time_sub")}</Text>

                    <View className="mt-4">
                        {isLoadingPrices ? (
                            <ActivityIndicator size="small" color="#FF9500" />
                        ) : (
                            <Text className="font-black text-3xl text-black dark:text-white">
                                {product?.displayPrice || '₹999.00'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                    className="w-full h-14 rounded-full items-center justify-center mt-3 bg-brand"
                    onPress={handlePurchase}
                    disabled={isPurchasing}
                >
                    {isPurchasing ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                        <Text className="font-bold text-lg text-white" numberOfLines={1}>{t("remove_ads_now")}</Text>
                    )}
                </TouchableOpacity>

                {canSimulateIap && (
                    <TouchableOpacity
                        className="border-[1.5px] border-brand w-full h-14 rounded-full items-center justify-center mt-4"
                        onPress={handlePurchase}
                        disabled={isPurchasing}
                    >
                        <Text className="font-semibold text-black dark:text-white">Simulate Test Purchase</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleRestore} disabled={isPurchasing} className="mt-6 items-center p-2">
                    <Text className="underline font-semibold text-gray-500 dark:text-gray-400">{t("restore_previous")}</Text>
                </TouchableOpacity>

                {/* Legal & Terms Section */}
                <View className="mt-8 items-center px-3">
                    <Text className="text-center leading-5 text-sm text-gray-500 dark:text-gray-400">
                        {t("agree")}{' '}
                        <Text className="font-bold text-brand" onPress={() => openLegalWebView("https://7pranayama.com/terms", "Terms of Service")}>
                            {t("terms_full")}
                        </Text>
                        {' '}{t("and")}{' '}
                        <Text className="font-bold text-brand" onPress={() => openLegalWebView("https://7pranayama.com/privacy", "Privacy Policy")}>
                            {t("privacy_full")}
                        </Text>.
                    </Text>
                </View>

            </ScrollView>

            {/* Legal WebView Modal */}
            <Modal visible={legalModalVisible} animationType="slide" onRequestClose={() => setLegalModalVisible(false)}>
                <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'bottom']}>
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                        <TouchableOpacity onPress={() => setLegalModalVisible(false)} className="p-1">
                            <MaterialIcons name="close" size={28} color="#FF9500" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-black dark:text-white">{legalTitle}</Text>
                        <View className="w-7" />
                    </View>

                    <View className="flex-1 bg-white dark:bg-zinc-950">
                        {isLegalLoading && (
                            <View className="absolute inset-0 items-center justify-center z-10 bg-white dark:bg-zinc-950">
                                <ActivityIndicator size="large" color="#FF9500" />
                            </View>
                        )}
                        <WebView
                            source={{ uri: legalUrl }}
                            onLoadEnd={() => setIsLegalLoading(false)}
                            injectedJavaScript={hideHeaderScript}
                            javaScriptEnabled={true}
                            showsVerticalScrollIndicator={false}
                            className="flex-1"
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>

    );
}