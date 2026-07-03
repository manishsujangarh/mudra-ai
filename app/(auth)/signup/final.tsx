import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../../src/lib/api';
import { Button } from "@/components/ui"; // 👉 Custom Button Use Kiya Hai
import { useTranslation } from 'react-i18next';

export default function FinalStep() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isTablet = width > 600;

    const signupData = params.signupData ? JSON.parse(params.signupData as string) : {};
    const { name, email, phone, password, gender, goals } = signupData;

    const { t } = useTranslation();

    const scaleValue = useRef(new Animated.Value(0)).current;
    const [loading, setLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);

    // 👉 TOAST SETUP
    const [toastConfig, setToastConfig] = useState({ visible: false, message: '', description: '', type: 'success' });
    const toastAnimY = useRef(new Animated.Value(-100)).current;

    const showToast = ({ message, description, type = 'success' }: { message: string, description: string, type: 'success' | 'danger' | 'warning' }) => {
        setToastConfig({ visible: true, message, description, type });
        Animated.sequence([
            Animated.timing(toastAnimY, { toValue: insets.top + 10, duration: 300, useNativeDriver: true }),
            Animated.delay(3000),
            Animated.timing(toastAnimY, { toValue: -100, duration: 300, useNativeDriver: true })
        ]).start(() => setToastConfig(prev => ({ ...prev, visible: false })));
    };

    const getToastColor = () => {
        if (toastConfig.type === 'danger') return 'bg-red-500 border-red-700';
        if (toastConfig.type === 'warning') return 'bg-orange-500 border-orange-700';
        return 'bg-green-500 border-green-700';
    };

    useEffect(() => {
        Animated.spring(scaleValue, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
    }, []);

    const submitUserData = async () => {
        try {
            const data = await apiFetch('/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, phone, password, password_confirmation: password, gender, goals: goals && goals.length > 0 ? goals : 'General Wellness', source: 'mudra_ai_app' }),
            });

            if (data.success || data.token) {
                if (data.token) {
                    await SecureStore.setItemAsync('auth_token', data.token);
                    await SecureStore.setItemAsync('userToken', data.token);
                    if (data.userdata?.name) await SecureStore.setItemAsync('user_name', data.userdata.name);
                    if (data.userdata) await SecureStore.setItemAsync('user_data', JSON.stringify(data.userdata));
                }
                await AsyncStorage.setItem('isLogged', 'true');
                await AsyncStorage.setItem('keep_signed_in', 'true');
                await AsyncStorage.multiRemove(['name', 'phone', 'email', 'password', 'gender', 'goals', 'phoneNumber', 'termsAccepted']);
                setIsSuccess(true);
            } else {
                showToast({ message: t('error'), description: data.message || t('registration_failed'), type: 'danger' });
            }
        } catch (error: any) {
            showToast({ message: t('error'), description: error.data?.message || t('failed_to_connect'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { submitUserData(); }, []);

    return (
        <SafeAreaView style={{ flex: 1 }} className="bg-sand">
            {/* 👉 CUSTOM TOAST UI */}
            <Animated.View className={`absolute w-[90%] self-center p-4 rounded-xl border z-50 shadow-lg ${getToastColor()}`} style={{ transform: [{ translateY: toastAnimY }] }}>
                <Text className="text-white font-bold text-base">{toastConfig.message}</Text>
                {toastConfig.description && <Text className="text-white font-medium text-sm mt-1">{toastConfig.description}</Text>}
            </Animated.View>

            <View className="flex-1 justify-center items-center px-6 max-w-lg w-full self-center">
                <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                    <Image source={require('../../../assets/icon.png')} className={`mb-8 ${isTablet ? 'w-64 h-64' : 'w-52 h-52'}`} resizeMode="contain" />
                </Animated.View>

                <View className="items-center mb-8">
                    <Text className="text-ink text-3xl font-extrabold mb-3 text-center">{t('welcome_message')}</Text>
                    <Text className="text-muted text-base text-center leading-6">
                        {loading ? 'Finalizing your account...' : (isSuccess ? t('registration_success') : 'Something went wrong.')}
                    </Text>
                </View>

                <View className="w-3/4">
                    <Button
                        label={isSuccess ? t('welcome_onbording') : 'Go Back & Retry'}
                        onPress={() => isSuccess ? router.replace('/(tabs)') : router.back()}
                        loading={loading}
                        variant={isSuccess ? "primary" : "secondary"}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}