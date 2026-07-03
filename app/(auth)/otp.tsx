import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../../src/lib/api';
import { Button } from "@/components/ui"; // 👉 TUMHARA CUSTOM BUTTON IMPORT KIYA HAI
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function OtpScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Expo router params hamesha string/string[] hote hain
    const email = params.email as string;
    const flow = params.flow as string;

    // Agar signupData pass hua hai toh usko wapas object me parse karna padega
    const signupData = params.signupData ? JSON.parse(params.signupData as string) : {};

    const { t } = useTranslation();

    const [otp, setOtp] = useState('');
    const [resendOtpCountdown, setResendOtpCountdown] = useState(60);
    const [isResendDisabled, setIsResendDisabled] = useState(true);
    const [loading, setLoading] = useState(false);

    // 👉 1. CUSTOM ANIMATION SETUP
    const slideAnim = useRef(new Animated.Value(50)).current; // Start slightly right
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
        ]).start();
    }, []);

    // 👉 2. CUSTOM TOAST/FLASH MESSAGE SETUP
    const [toastConfig, setToastConfig] = useState({ visible: false, message: '', description: '', type: 'success' });
    const toastAnimY = useRef(new Animated.Value(-100)).current;

    const showToast = ({ message, description, type = 'success' }: { message: string, description: string, type: 'success' | 'danger' | 'warning' }) => {
        setToastConfig({ visible: true, message, description, type });
        Animated.sequence([
            Animated.timing(toastAnimY, { toValue: 50, duration: 300, useNativeDriver: true }),
            Animated.delay(3000),
            Animated.timing(toastAnimY, { toValue: -100, duration: 300, useNativeDriver: true })
        ]).start(() => setToastConfig(prev => ({ ...prev, visible: false })));
    };

    // Helper function for toast colors (Tailwind classes)
    const getToastColor = () => {
        if (toastConfig.type === 'danger') return 'bg-red-500 border-red-700';
        if (toastConfig.type === 'warning') return 'bg-orange-500 border-orange-700';
        return 'bg-green-500 border-green-700';
    };

    // Countdown logic for resend OTP button
    useEffect(() => {
        if (resendOtpCountdown > 0) {
            setIsResendDisabled(true);
            const timer = setTimeout(() => setResendOtpCountdown(resendOtpCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsResendDisabled(false);
        }
    }, [resendOtpCountdown]);

    const validateOTP = () => otp.length === 6 && /^\d+$/.test(otp);

    // 👉 Handle OTP verification submission
    const handleVerifyOTP = async () => {
        if (!validateOTP()) return showToast({ message: t('alert'), description: t('please_enter_valid_otp'), type: "warning" });

        setLoading(true);
        try {
            const data = await apiFetch('/verify-email-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp }),
            });

            if (data.success) {
                // 🔥 LOGIC: Check karein ki ye Signup hai ya Login
                if (flow === 'signup') {
                    showToast({ message: 'Verified', description: 'Email verified successfully!', type: "success" });

                    setTimeout(() => {
                        // Expo router me object ko stringify karke bhejna padta hai
                        router.push({
                            pathname: '/(auth)/signup/gender',
                            params: { signupData: JSON.stringify(signupData) }
                        });
                    }, 1000);

                } else {
                    // Existing Login Flow
                    if (data.token) {
                        await SecureStore.setItemAsync('auth_token', data.token);
                        await SecureStore.setItemAsync('userToken', data.token);
                        if (data.userdata?.name) await SecureStore.setItemAsync('user_name', data.userdata.name);
                        if (data.userdata) await SecureStore.setItemAsync('user_data', JSON.stringify(data.userdata));
                    }
                    await AsyncStorage.setItem('isLogged', 'true');

                    showToast({ message: 'Success', description: 'Logged in successfully!', type: "success" });
                    setTimeout(() => router.replace('/(tabs)'), 1000);
                }
            } else {
                showToast({ message: t('alert'), description: data.message || 'Invalid OTP', type: "danger" });
            }
        } catch (error: any) {
            const errorMsg = error.data?.message || t('failed_to_connect');
            showToast({ message: t('error'), description: errorMsg, type: "danger" });
        } finally {
            setLoading(false);
        }
    };

    // 👉 Handle Resend OTP
    const handleResendOTP = async () => {
        try {
            setResendOtpCountdown(60);
            setIsResendDisabled(true);

            const data = await apiFetch('/send-email-otp', {
                method: 'POST',
                body: JSON.stringify({ email, app_source: 'mudra' }),
            });

            if (data.success) {
                showToast({ message: t('success'), description: t('otp_sent_to_email'), type: "success" });
            } else {
                setResendOtpCountdown(0);
                showToast({ message: t('alert'), description: data.message || t('otp_resend_failed'), type: "danger" });
            }
        } catch (error: any) {
            setResendOtpCountdown(0);
            const errorMsg = error.data?.message || t('failed_to_connect');
            showToast({ message: t('error'), description: errorMsg, type: "danger" });
        }
    };

    // 🔥 👉 UI REWRITTEN WITH SEMANTIC CLASSES (`bg-sand`, `text-ink`, `bg-surface`, `text-brand`, etc.)
    return (
        <SafeAreaView style={{ flex: 1 }}>

            <View className="flex-1 bg-sand">
                {/* Set dynamic header title based on flow - Removing hardcoded dark background so it inherits from app theme */}
                <Stack.Screen options={{ title: flow === 'signup' ? t('sign_up') : t('login'), headerShadowVisible: false, headerStyle: { backgroundColor: 'transparent' } }} />

                {/* 👉 CUSTOM TOAST */}
                <Animated.View
                    className={`absolute w-[90%] self-center p-4 rounded-xl border z-50 shadow-lg ${getToastColor()}`}
                    style={{ transform: [{ translateY: toastAnimY }] }}
                >
                    <Text className="text-white font-bold text-base">{toastConfig.message}</Text>
                    {toastConfig.description ? <Text className="text-white font-medium text-sm mt-1">{toastConfig.description}</Text> : null}
                </Animated.View>

                <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="flex-grow items-center">
                    <Animated.View
                        className="w-full px-6 pt-5 max-w-lg"
                        style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
                    >
                        {/* Heading */}
                        <View className="mb-8 text-left">
                            <Text className="text-ink text-3xl font-bold mb-2">{t('otp_verification')}</Text>
                            <Text className="text-muted text-base">
                                {t('otp_description')} <Text className="text-ink font-bold">{email}</Text>
                            </Text>
                        </View>

                        {/* OTP Input */}
                        <View className="mb-6">
                            <Text className="text-ink text-sm font-medium mb-3">{t('enter_otp')}</Text>
                            <TextInput
                                className="w-full h-14 bg-surface text-ink border border-ink/10 rounded-2xl px-4 text-2xl text-center tracking-[8px]"
                                keyboardType="number-pad"
                                maxLength={6}
                                placeholder="••••••"
                                placeholderTextColor="#888888"
                                value={otp}
                                onChangeText={setOtp}
                                editable={!loading}
                            />
                        </View>

                        {/* 👉 CUSTOM BUTTON (Replaced standard touchable) */}
                        <View className="mt-6">
                            <Button
                                label={t('verify')}
                                onPress={handleVerifyOTP}
                                loading={loading}
                                disabled={loading}
                            />
                        </View>

                        {/* Resend Link */}
                        <View className="flex-row justify-center items-center mt-10">
                            <Text className="text-muted text-base" numberOfLines={1}>
                                {resendOtpCountdown > 0 ? `${t('resend_otp_in')} ${resendOtpCountdown} ${t('seconds')}` : t('did_not_receive_otp')}
                            </Text>
                            <TouchableOpacity disabled={isResendDisabled} onPress={handleResendOTP} className={`ml-2 ${isResendDisabled ? 'opacity-50' : 'opacity-100'}`}>
                                <Text className="text-brand font-bold text-base" numberOfLines={1}>{t('resend')}</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}