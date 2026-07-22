import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList, Platform, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../../src/lib/api';
import { Button } from "@/components/ui"; // 👉 Custom Button Use Kiya Hai
import WebView from 'react-native-webview';
import { useTranslation } from 'react-i18next';

export default function SignupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [legalUrl, setLegalUrl] = useState('');
    const [legalTitle, setLegalTitle] = useState('');
    const [isLegalLoading, setIsLegalLoading] = useState(true);

    const COUNTRIES = [
        { name: "Afghanistan", code: "AF", dialCode: "+93", flag: "🇦🇫" },
        { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
        { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
        { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
        { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
        { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
    ];

    const { t } = useTranslation();
    const nameInputRef = useRef<TextInput>(null);
    const phoneInputRef = useRef<TextInput>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSecure, setIsSecure] = useState(true);
    const [emailExists, setEmailExists] = useState(false);
    const [phoneExists, setPhoneExists] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === "IN") || COUNTRIES[0]);
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [legalModalVisible, setLegalModalVisible] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
        ]).start();
    }, []);

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
        if (toastConfig.type === 'warning') return 'bg-brand border-orange-700';
        return 'bg-green-500 border-green-700';
    };

    const handleSignup = async () => {
        if (!name.trim()) { nameInputRef.current?.focus(); return showToast({ message: t('alert'), description: t('please_enter_your_name'), type: "warning" }); }
        if (!phoneNumber) { phoneInputRef.current?.focus(); return showToast({ message: t('alert'), description: t('phone_number'), type: "warning" }); }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { emailInputRef.current?.focus(); return showToast({ message: t('alert'), description: t('please_enter_valid_email'), type: 'warning' }); }
        if (!password) { passwordInputRef.current?.focus(); return showToast({ message: t('alert'), description: t('please_enter_your_password'), type: 'warning' }); }
        if (!isChecked) return showToast({ message: t('alert'), description: 'Please accept terms', type: 'warning' });

        setLoading(true);
        try {
            const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;
            const phoneData = await apiFetch('/check-phone', { method: 'POST', body: JSON.stringify({ phone: fullPhone }) }).catch(() => ({ status: false }));
            if (phoneData?.exists || phoneData?.status === false) {
                setPhoneExists(true); phoneInputRef.current?.focus();
                showToast({ message: 'Alert', description: 'Phone number registered.', type: 'danger' });
                setLoading(false); return;
            }
            const emailData = await apiFetch('/check-email', { method: 'POST', body: JSON.stringify({ email }) }).catch(() => ({ status: false }));
            if (emailData?.exists || emailData?.status === false) {
                setEmailExists(true); emailInputRef.current?.focus();
                showToast({ message: 'Alert', description: 'Email registered.', type: 'danger' });
                setLoading(false); return;
            }

            const otpData = await apiFetch('/send-email-otp', {
                method: 'POST',
                body: JSON.stringify({ email, type: 'signup', app_source: 'mudra' })
            });

            if (otpData.success) {
                showToast({ message: t('success'), description: t('otp_sent_to_email'), type: 'success' });
                setTimeout(() => {
                    router.push({
                        pathname: '/(auth)/otp',
                        params: { email, flow: 'signup', signupData: JSON.stringify({ name, phone: fullPhone, email, password }) }
                    });
                }, 1000);
            }
        } catch (error) { showToast({ message: 'Error', description: 'Network error.', type: 'danger' }); } finally { setLoading(false); }
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
    const openLegalWebView = (url: string, title: string) => {
        setLegalUrl(url);
        setLegalTitle(title);
        setIsLegalLoading(true);
        setLegalModalVisible(true);
    };



    return (
        <SafeAreaView style={{ flex: 1 }} className="bg-sand" edges={['bottom', 'top']}>
            <Animated.View className={`absolute w-[90%] self-center p-4 rounded-xl border z-50 shadow-lg ${getToastColor()}`} style={{ transform: [{ translateY: toastAnimY }] }}>
                <Text className="text-white font-bold text-base">{toastConfig.message}</Text>
                {toastConfig.description && <Text className="text-white font-medium text-sm mt-1">{toastConfig.description}</Text>}
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Animated.View className="w-full px-6 py-5 max-w-lg self-center" style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                    <View className="mb-8">
                        <Text className="text-ink text-3xl font-bold mb-2">{t('join')}</Text>
                        <Text className="text-muted text-base">{t('start_experience')}</Text>
                    </View>

                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('name')}</Text>
                        <TextInput ref={nameInputRef} className="w-full h-14 bg-surface text-ink border border-ink/10 rounded-2xl px-4 text-base" placeholder={t('enter_your_name')} placeholderTextColor="#888" value={name} onChangeText={setName} />
                    </View>

                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('phone_number')}</Text>
                        <View className={`flex-row items-center w-full h-14 bg-surface border rounded-2xl px-4 ${phoneExists ? 'border-red-500' : 'border-ink/10'}`}>
                            <TouchableOpacity className="flex-row items-center pr-3 border-r border-ink/20 mr-3" onPress={() => setIsCountryModalVisible(true)}>
                                {Platform.OS === 'android' && <Text className="text-base mr-1">{selectedCountry.flag}</Text>}
                                <Text className="text-ink text-base">{selectedCountry.dialCode}</Text>
                            </TouchableOpacity>
                            <TextInput className="flex-1 text-ink text-base" placeholder="0000000000" placeholderTextColor="#888" value={phoneNumber} keyboardType="phone-pad" onChangeText={v => setPhoneNumber(v.replace(/[^0-9]/g, ''))} />
                        </View>
                    </View>

                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('email_address')}</Text>
                        <TextInput ref={emailInputRef} className={`w-full h-14 bg-surface text-ink border rounded-2xl px-4 text-base ${emailExists ? 'border-red-500' : 'border-ink/10'}`} placeholder="hello@example.com" placeholderTextColor="#888" value={email} keyboardType="email-address" onChangeText={setEmail} />
                    </View>

                    <View className="mb-5">
                        <Text className="text-ink text-sm font-medium mb-2">{t('password')}</Text>
                        <View className="relative justify-center">
                            <TextInput ref={passwordInputRef} className="w-full h-14 bg-surface text-ink border border-ink/10 rounded-2xl px-4 text-base pr-12" placeholder={t('password')} placeholderTextColor="#888" secureTextEntry={isSecure} value={password} onChangeText={setPassword} />
                            <TouchableOpacity onPress={() => setIsSecure(!isSecure)} className="absolute right-4"><MaterialIcons name={isSecure ? 'visibility-off' : 'visibility'} size={24} color="#888" /></TouchableOpacity>
                        </View>
                    </View>

                    <View className="flex-row items-center mb-8 pr-4">
                        <TouchableOpacity onPress={() => setIsChecked(!isChecked)} className={`w-6 h-6 border rounded-lg mr-3 items-center justify-center ${isChecked ? 'bg-brand border-brand' : 'bg-surface border-ink/20'}`}>
                            {isChecked && <MaterialIcons name="check" size={16} color="white" />}
                        </TouchableOpacity>
                        <View className="flex-row flex-wrap flex-1">
                            <Text className="text-muted text-sm">{t('i_agree_to_mudra')} </Text>
                            <TouchableOpacity onPress={() => openLegalWebView("https://7pranayama.com/terms", 'Terms & Conditions')}>
                                <Text className="text-brand text-sm font-medium underline" numberOfLines={1}>
                                    {t('terms_conditions')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Button label={t('sign_up')} onPress={handleSignup} loading={loading} disabled={loading} />

                    <View className="flex-row justify-center mt-8">
                        <Text className="text-muted text-base">{t('already_have_account')} </Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}><Text className="text-brand font-bold text-base ml-1" numberOfLines={1}>{t('login')}</Text></TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>

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
        </SafeAreaView >
    );
}