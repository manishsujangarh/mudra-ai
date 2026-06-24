import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../../src/lib/api';
import { Button } from "@/components/ui";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const t = (key: string) => {
    const translations: any = {
      forgot_password_question: 'Forgot Password?',
      enter_email_reset_password: 'Enter your email address to get a password reset link.',
      email_address: 'Email Address',
      email: 'Email',
      reset_password: 'Reset Password',
      alert: 'Alert',
      please_enter_your_email: 'Please enter your email',
      please_enter_valid_email: 'Invalid email format',
      success: 'Success',
      password_reset_link_sent: 'Reset link sent to your email!',
      error: 'Error',
      no_user_found: 'User not found',
      login: 'Login',
      failed_to_connect: 'Failed to connect to the server.'
    };
    return translations[key] || key;
  };

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // 👉 ANIMATION SETUP
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, []);

  // 👉 CUSTOM TOAST SETUP
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

  const getToastColor = () => {
    if (toastConfig.type === 'danger') return 'bg-red-500 border-red-700';
    if (toastConfig.type === 'warning') return 'bg-orange-500 border-orange-700';
    return 'bg-green-500 border-green-700';
  };

  useEffect(() => {
    const getItems = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        if (storedEmail) setEmail(storedEmail);
      } catch (error) { console.error(error); }
    };
    getItems();
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handlePasswordReset = async () => {
    if (!email) return showToast({ message: t('alert'), description: t('please_enter_your_email'), type: "warning" });
    if (!validateEmail(email)) return showToast({ message: t('alert'), description: t('please_enter_valid_email'), type: "warning" });

    setLoading(true);
    try {
      const data = await apiFetch('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, app_source: 'mudra' }),
      });

      if (data.success) {
        showToast({ message: t('success'), description: t('password_reset_link_sent'), type: "success" });
        setTimeout(() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(auth)/login');
        }, 2000);
      } else {
        showToast({ message: t('error'), description: data.message || t('no_user_found'), type: "danger" });
      }
    } catch (error: any) {
      showToast({ message: t('error'), description: error.data?.message || t('failed_to_connect'), type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-1 bg-sand">
        <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: 'transparent' }, headerShadowVisible: false }} />

        {/* 👉 CUSTOM TOAST UI */}
        <Animated.View
          className={`absolute w-[90%] self-center p-4 rounded-xl border z-50 shadow-lg ${getToastColor()}`}
          style={{ transform: [{ translateY: toastAnimY }] }}
        >
          <Text className="text-white font-bold text-base">{toastConfig.message}</Text>
          {toastConfig.description ? <Text className="text-white font-medium text-sm mt-1">{toastConfig.description}</Text> : null}
        </Animated.View>

        <ScrollView contentContainerClassName="flex-grow items-center justify-center px-6" keyboardShouldPersistTaps="handled">
          <Animated.View
            className="w-full max-w-lg pb-10"
            style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
          >
            <View className="mb-10 text-left">
              <Text className="text-ink text-3xl font-bold mb-3">{t('forgot_password_question')}</Text>
              <Text className="text-muted text-base leading-6">{t('enter_email_reset_password')}</Text>
            </View>

            <View className="mb-6">
              <Text className="text-ink text-sm font-medium mb-3">{t('email_address')}</Text>
              <TextInput
                className="w-full h-14 bg-surface text-ink border border-ink/10 rounded-2xl px-5 text-base"
                placeholder={t('email')}
                placeholderTextColor="#888888"
                value={email}
                onChangeText={(text) => setEmail(text.replace(/\s+/g, ''))}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* 👉 USE CUSTOM BUTTON */}
            <Button
              label={t('reset_password')}
              onPress={handlePasswordReset}
              loading={loading}
              disabled={loading}
            />

          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}