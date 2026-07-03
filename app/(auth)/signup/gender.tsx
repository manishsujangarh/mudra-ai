import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const GENDER_OPTIONS = [
  { id: 'Male', labelKey: 'men', icon: '👨' },
  { id: 'Female', labelKey: 'woman', icon: '👩' },
  { id: 'Other', labelKey: 'other', icon: '🌈' },
  { id: 'PreferNotToSay', labelKey: 'prefer_not_to_say', icon: '🔒' }
];

export default function GenderStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const signupData = params.signupData ? JSON.parse(params.signupData as string) : {};

  const { t } = useTranslation();

  const [gender, setGender] = useState<string | null>(null);

  // 👉 TOAST SETUP (Semantic classes)
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

  // 👉 ANIMATIONS SETUP
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(20)).current;

  const cardAnims = useRef(GENDER_OPTIONS.map(() => ({ opacity: new Animated.Value(0), translateY: new Animated.Value(20) }))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();

    const cardAnimations = cardAnims.map((anim, index) => Animated.sequence([
      Animated.delay(index * 150),
      Animated.parallel([
        Animated.timing(anim.opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(anim.translateY, { toValue: 0, duration: 500, useNativeDriver: true })
      ])
    ]));
    Animated.parallel(cardAnimations).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(buttonsTranslateY, { toValue: 0, duration: 600, useNativeDriver: true })
      ])
    ]).start();
  }, []);

  useEffect(() => {
    const getGender = async () => {
      try { const storedGender = await AsyncStorage.getItem('gender'); if (storedGender) setGender(storedGender); }
      catch (error) { console.error(error); }
    };
    getGender();
  }, []);

  const handleGenderSelect = async (selectedGender: string) => {
    setGender(selectedGender);
    try { await AsyncStorage.setItem('gender', selectedGender); }
    catch (error) { console.error(error); }
  };

  const handleNext = () => {
    if (!gender) return showToast({ message: t('alert'), description: t('select_your_gender'), type: "warning" });
    const updatedSignupData = { ...signupData, gender, goals: [] };
    router.push({
      pathname: '/(auth)/signup/final',
      params: { signupData: JSON.stringify(updatedSignupData) }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-sand" edges={['bottom', 'top']}>

      {/* 👉 CUSTOM TOAST UI */}
      <Animated.View className={`absolute w-[90%] self-center p-4 rounded-xl border z-50 shadow-lg ${getToastColor()}`} style={{ transform: [{ translateY: toastAnimY }] }}>
        <Text className="text-white font-bold text-base">{toastConfig.message}</Text>
        {toastConfig.description && <Text className="text-white font-medium text-sm mt-1">{toastConfig.description}</Text>}
      </Animated.View>

      <View className="flex-1 px-6 pt-10 pb-5 max-w-lg w-full self-center">

        <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }} className="mb-10 items-start">
          <Text className="text-ink text-3xl font-extrabold mb-2 tracking-wide">{t('select_your_gender')}</Text>
          <Text className="text-muted text-base leading-6">{t('understand_you')}</Text>
        </Animated.View>

        <View className="flex-1 w-full">
          {GENDER_OPTIONS.map((option, index) => {
            const isSelected = gender === option.id;
            const animStyles = { opacity: cardAnims[index].opacity, transform: [{ translateY: cardAnims[index].translateY }] };

            return (
              <Animated.View key={option.id} style={animStyles}>
                <TouchableOpacity
                  onPress={() => handleGenderSelect(option.id)}
                  activeOpacity={0.8}
                  className={`flex-row items-center justify-between py-3 px-4 mb-4 border-[1.5px] rounded-[20px] ${isSelected ? 'border-brand bg-brand/10' : 'border-ink/10 bg-surface'}`}
                >
                  <View className="flex-row items-center h-11">
                    <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-4 ${isSelected ? 'bg-brand/20' : 'bg-ink/5'}`}>
                      <Text className="text-xl">{option.icon}</Text>
                    </View>
                    <Text className={`text-base tracking-wide ${isSelected ? 'text-brand font-bold' : 'text-ink font-medium'}`}>
                      {t(option.labelKey)}
                    </Text>
                  </View>

                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-brand bg-brand/10' : 'border-muted'}`}>
                    {isSelected && <View className="w-3 h-3 rounded-full bg-brand" />}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View style={{ opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslateY }] }} className="flex-row justify-between pb-2 gap-3 mt-4">
          <TouchableOpacity activeOpacity={0.8} className="flex-1 h-14 rounded-full border border-ink/10 items-center justify-center" onPress={() => router.replace('/(tabs)')}>
            <Text className="text-muted text-base font-semibold">{t('skip')}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} className="flex-1 h-14 bg-brand rounded-full items-center justify-center shadow-lg shadow-brand/30" onPress={handleNext}>
            <Text className="text-white text-base font-bold">{t('next')}</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}