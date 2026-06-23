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

export default function PremiumScreen() {
    const [product, setProduct] = useState<PremiumCatalogItem | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isLoadingPrices, setIsLoadingPrices] = useState(true);

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
                    "Login Required",
                    "Please sign in to purchase the ad-free experience.",
                    [{ text: "Go to Login", onPress: () => router.push('/(auth)/login') }, { text: "Cancel", style: "cancel" }]
                );
                return;
            }

            setIsPurchasing(true);

            const ownershipStatus = await refreshPremiumStatus();
            if (ownershipStatus?.hasPremium) {
                Alert.alert('Already Purchased', 'You have already removed the ads forever.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
                return;
            }

            if (canSimulateIap) {
                await savePremiumFlag(true);
                Alert.alert('Purchase Successful', 'Test purchase complete! Ads are now removed.', [
                    { text: 'OK', onPress: () => router.back() }
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
                Alert.alert('Congratulations! 🎉', 'Ads have been successfully removed forever!', [
                    { text: 'Awesome', onPress: () => router.back() }
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
                Alert.alert("Login Required", "Please sign in to restore your purchase.", [
                    { text: "Go to Login", onPress: () => router.push('/(auth)/login') }, { text: "Cancel", style: "cancel" }
                ]);
                return;
            }

            setIsPurchasing(true);
            const ownershipStatus = await refreshPremiumStatus();

            if (ownershipStatus?.hasPremium) {
                DeviceEventEmitter.emit('PremiumUpdated');
                Alert.alert('Success', 'Your Ad-Free experience has been restored!');
            } else {
                Alert.alert('No Purchase Found', 'We could not find an active purchase for this account.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const renderFeatureItem = (text: string) => (
        <View className="flex-row items-center my-2">
            <Icon name="check-circle" size={20} color="#f97316" className="mr-3" />
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
                    <Text className="font-black text-3xl text-black dark:text-white">
                        Remove <Text className="text-orange-500">Ads</Text>
                    </Text>
                    <Text className="mt-2 text-base text-gray-500 dark:text-gray-400 text-center">
                        Enjoy a seamless, interruption-free experience
                    </Text>
                </View>

                {/* Features Box */}
                <View className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-900 p-5 mb-6">
                    {renderFeatureItem('No Annoying Banner Ads')}
                    {renderFeatureItem('No Interstitial Popup Ads')}
                    {renderFeatureItem('Faster App Performance')}
                    {renderFeatureItem('One-time payment, lifetime access')}
                </View>

                {/* Single Plan Card */}
                <View className="border-2 border-orange-500 rounded-2xl p-5 mb-6 bg-orange-50/50 dark:bg-orange-500/10">
                    <View className="flex-row justify-between items-center">
                        <Text className="font-extrabold text-xl text-black dark:text-white">{product?.title || 'Lifetime Access'}</Text>
                        <View className="bg-orange-500 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold">Best Value</Text>
                        </View>
                    </View>
                    <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">Pay once, remove ads forever</Text>

                    <View className="mt-4">
                        {isLoadingPrices ? (
                            <ActivityIndicator size="small" color="#f97316" />
                        ) : (
                            <Text className="font-black text-3xl text-black dark:text-white">
                                {product?.displayPrice || '₹999.00'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                    className="w-full h-14 rounded-full items-center justify-center mt-3 bg-orange-500"
                    onPress={handlePurchase}
                    disabled={isPurchasing}
                >
                    {isPurchasing ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                        <Text className="font-bold text-lg text-white">Remove Ads Now</Text>
                    )}
                </TouchableOpacity>

                {canSimulateIap && (
                    <TouchableOpacity
                        className="border-[1.5px] border-orange-500 w-full h-14 rounded-full items-center justify-center mt-4"
                        onPress={handlePurchase}
                        disabled={isPurchasing}
                    >
                        <Text className="font-semibold text-black dark:text-white">Simulate Test Purchase</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleRestore} disabled={isPurchasing} className="mt-6 items-center p-2">
                    <Text className="underline font-semibold text-gray-500 dark:text-gray-400">Restore Previous Purchase</Text>
                </TouchableOpacity>

                {/* Legal & Terms Section */}
                <View className="mt-8 items-center px-3">
                    <Text className="text-center leading-5 text-sm text-gray-500 dark:text-gray-400">
                        By proceeding, you agree to our{' '}
                        <Text className="font-bold text-orange-500" onPress={() => openLegalWebView("https://7pranayama.com/terms", "Terms of Service")}>
                            Terms of Service
                        </Text>
                        {' '}and{' '}
                        <Text className="font-bold text-orange-500" onPress={() => openLegalWebView("https://7pranayama.com/privacy", "Privacy Policy")}>
                            Privacy Policy
                        </Text>.
                    </Text>
                </View>

            </ScrollView>

            {/* Legal WebView Modal */}
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