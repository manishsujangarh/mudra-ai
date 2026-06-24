import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import { apiFetch } from '../../src/lib/api';

export default function LoginScreen() {
    const router = useRouter();

    // Hardcoded for now, replace with actual i18n logic if needed
    const t = (key: string) => {
        const translations: any = {
            login: 'Login', message: 'Welcome back to Mudra AI', password: 'Password',
            email: 'Email', otp: 'OTP', email_address: 'Email Address',
            keep_me_signed_in: 'Keep me signed in', forgot_password: 'Forgot Password?',
            send: 'Send', dont_have_an_account: "Don't have an account?", sign_up: 'Sign Up',
            alert: 'Alert', email_required: 'Email is required', password_required: 'Password is required',
            success: 'Success', login_successful: 'Login successful!', error: 'Error',
            correct_credentials: 'Check your credentials', failed_to_connect: 'Network error',
            otp_sent_to_email: 'OTP sent to your email', failed_to_send_otp: 'Failed to send OTP'
        };
        return translations[key] || key;
    };

    const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(true);
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // 👉 1. CUSTOM ANIMATION SETUP (Replaces animatable)
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const toggleCheckbox = () => setIsChecked(!isChecked);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    // 👉 2. CUSTOM TOAST/FLASH MESSAGE SETUP
    const [toastConfig, setToastConfig] = useState({ visible: false, message: '', description: '', type: 'success' });
    const toastAnimY = useRef(new Animated.Value(-100)).current; // Start above screen

    const showToast = ({ message, description, type = 'success' }: { message: string, description: string, type: 'success' | 'danger' | 'warning' }) => {
        setToastConfig({ visible: true, message, description, type });

        // Slide down, wait 3 seconds, slide up
        Animated.sequence([
            Animated.timing(toastAnimY, { toValue: 50, duration: 300, useNativeDriver: true }),
            Animated.delay(3000),
            Animated.timing(toastAnimY, { toValue: -100, duration: 300, useNativeDriver: true })
        ]).start(() => {
            setToastConfig(prev => ({ ...prev, visible: false }));
        });
    };

    // 👉 Helper function for toast colors (Updated to Tailwind colors)
    const getToastColor = () => {
        if (toastConfig.type === 'danger') return 'bg-red-500 border-red-700';
        if (toastConfig.type === 'warning') return 'bg-orange-500 border-orange-700';
        return 'bg-green-500 border-green-700';
    };

    // 👉 COMMON SUCCESS HANDLER
    const handleSuccessfulLogin = async (data: any) => {
        const { userdata, token } = data;
        if (token) {
            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('userToken', token);
            if (userdata?.name) await SecureStore.setItemAsync('user_name', userdata.name);
            if (userdata) await SecureStore.setItemAsync('user_data', JSON.stringify(userdata));
        }

        await AsyncStorage.setItem('keep_signed_in', isChecked ? 'true' : 'false');
        await AsyncStorage.setItem('isLogged', 'true');

        showToast({ message: t('success'), description: t('login_successful'), type: 'success' });

        // Short delay before navigating so user can see the success toast
        setTimeout(() => {
            router.replace('/(tabs)');
        }, 1000);
    };

    // 👉 PASSWORD LOGIN LOGIC
    const handlePasswordLogin = async () => {
        if (!email) return showToast({ message: t('alert'), description: t('email_required'), type: 'warning' });
        if (!password) return showToast({ message: t('alert'), description: t('password_required'), type: 'warning' });

        setLoading(true);
        try {
            const data = await apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (data.success || data.token) {
                handleSuccessfulLogin(data);
            } else {
                showToast({ message: t('error'), description: data.message || t('correct_credentials'), type: 'danger' });
            }
        } catch (error: any) {
            const errorMsg = error.data?.message || t('failed_to_connect');
            showToast({ message: t('error'), description: errorMsg, type: "danger" });
        } finally {
            setLoading(false);
        }
    };

    // 👉 SEND OTP LOGIC
    const handleSendOTP = async () => {
        if (!email) return showToast({ message: t('alert'), description: t('email_required'), type: 'warning' });

        setOtpLoading(true);
        try {
            const data = await apiFetch('/send-email-otp', {
                method: 'POST',
                body: JSON.stringify({ email, app_source: 'mudra' }),
            });

            if (data.success) {
                showToast({ message: t('success'), description: t('otp_sent_to_email'), type: 'success' });
                await AsyncStorage.setItem('keep_signed_in', isChecked ? 'true' : 'false');

                setTimeout(() => {
                    router.push({ pathname: '/(auth)/otp', params: { email } });
                }, 1000);
            } else {
                showToast({ message: t('error'), description: data.message || t('failed_to_send_otp'), type: 'danger' });
            }
        } catch (error: any) {
            const errorMsg = error.data?.message || t('failed_to_connect');
            showToast({ message: t('error'), description: errorMsg, type: "danger" });
        } finally {
            setOtpLoading(false);
        }
    };

    // 🔥 👉 UI REWRITTEN WITH SEMANTIC CLASSES (`bg-sand`, `text-ink`, `bg-surface`, `text-brand`, etc.)
    return (
        <View className="flex-1 bg-sand">
            {/* 👉 CUSTOM TOAST COMPONENT UI */}
            <Animated.View
                className={`absolute w-[90%] self-center p-4 rounded-xl border z-50 shadow-lg ${getToastColor()}`}
                style={{ transform: [{ translateY: toastAnimY }] }}
            >
                <Text className="text-white font-bold text-base">{toastConfig.message}</Text>
                {toastConfig.description ? (
                    <Text className="text-white font-medium text-sm mt-1">{toastConfig.description}</Text>
                ) : null}
            </Animated.View>

            <ScrollView contentContainerClassName="flex-grow items-center justify-center" keyboardShouldPersistTaps="handled">
                <Animated.View style={{ opacity: fadeAnim }} className="w-full px-6 py-8 justify-center max-w-lg">

                    {/* Heading */}
                    <View className="mb-8">
                        <Text className="text-ink font-bold text-3xl mb-2">{t('login')}</Text>
                        <Text className="text-muted text-base">{t('message')}</Text>
                    </View>

                    {/* 👉 LOGIN METHOD SWITCHER (TABS) */}
                    <View className="flex-row mb-6 border-b border-ink/10">
                        <TouchableOpacity
                            className={`flex-1 py-3 items-center ${loginMethod === 'password' ? 'border-b-2 border-brand' : ''}`}
                            onPress={() => setLoginMethod('password')}
                        >
                            <Text className={`text-base ${loginMethod === 'password' ? 'text-brand font-bold' : 'text-muted'}`}>
                                {t("password")}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-1 py-3 items-center ${loginMethod === 'otp' ? 'border-b-2 border-brand' : ''}`}
                            onPress={() => setLoginMethod('otp')}
                        >
                            <Text className={`text-base ${loginMethod === 'otp' ? 'text-brand font-bold' : 'text-muted'}`}>
                                {t("email")} {t("otp")}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 👉 COMMON EMAIL INPUT */}
                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('email_address')}</Text>
                        <TextInput
                            className="w-full bg-surface text-ink border border-ink/10 rounded-2xl px-5 py-4 text-base"
                            placeholder={t('email')}
                            placeholderTextColor="#888888"
                            value={email}
                            onChangeText={(text) => setEmail(text.replace(/\s+/g, ''))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading && !otpLoading}
                        />
                    </View>

                    {/* 👉 PASSWORD INPUT */}
                    {loginMethod === 'password' && (
                        <View className="mb-5">
                            <Text className="text-ink text-sm font-medium mb-2">{t('password')}</Text>
                            <View className="relative justify-center">
                                <TextInput
                                    className="w-full bg-surface text-ink border border-ink/10 rounded-2xl px-5 py-4 text-base pr-12"
                                    placeholder={t('password')}
                                    placeholderTextColor="#888888"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={(text) => setPassword(text.replace(/\s+/g, ''))}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="absolute right-4" disabled={loading}>
                                    <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#888888" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* 👉 CHECKBOX: Keep me signed in */}
                    <View className="flex-row items-center mb-8">
                        <TouchableOpacity
                            onPress={toggleCheckbox}
                            disabled={loading || otpLoading}
                            className={`w-6 h-6 border rounded-lg mr-3 items-center justify-center ${isChecked ? 'bg-brand border-brand' : 'bg-surface border-ink/20'}`}
                        >
                            {isChecked && <MaterialIcons name="check" size={16} color="#FFF" />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleCheckbox} activeOpacity={0.8}>
                            <Text className="text-muted text-sm">{t('keep_me_signed_in')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 👉 DYNAMIC ACTION BUTTON */}
                    {loginMethod === 'password' ? (
                        <>
                            <TouchableOpacity
                                disabled={loading}
                                className={`w-full h-14 bg-brand rounded-full items-center justify-center ${loading ? 'opacity-70' : 'opacity-100'}`}
                                onPress={handlePasswordLogin}
                            >
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text className="text-white text-lg font-bold">{t('login')}</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity className="mt-4 self-start" onPress={() => router.push('/(auth)/forgot-password')} disabled={loading}>
                                <Text className="text-brand font-medium text-sm">{t('forgot_password')}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            disabled={otpLoading}
                            className={`w-full h-14 bg-brand rounded-full items-center justify-center ${otpLoading ? 'opacity-70' : 'opacity-100'}`}
                            onPress={handleSendOTP}
                        >
                            {otpLoading ? <ActivityIndicator color="#FFF" /> : <Text className="text-white text-lg font-bold">{t("send")} {t("otp")}</Text>}
                        </TouchableOpacity>
                    )}

                    {/* 👉 SIGN UP LINK */}
                    <View className="flex-row justify-center mt-10">
                        <Text className="text-muted text-base">{t('dont_have_an_account')} </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={loading || otpLoading}>
                            <Text className="text-brand font-bold text-base ml-1">{t('sign_up')}</Text>
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </ScrollView>
        </View>
    );
}