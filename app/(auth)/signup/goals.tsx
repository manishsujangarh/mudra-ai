import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Animated, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from "@/components/ui"; // 👉 Custom Button Use Kiya Hai

export default function GoalsStep() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const params = useLocalSearchParams();

    const signupData = params.signupData ? JSON.parse(params.signupData as string) : {};
    const numColumns = width > 600 ? 3 : 2;

    const t = (key: string) => {
        const translations: any = {
            select_your_fitness_goals: 'Select your fitness goals',
            understand_you: 'This helps us personalize your daily routines.',
            stress_relief: 'Stress Relief', flexibility: 'Flexibility', weight_loss: 'Weight Loss',
            weight_gain: 'Weight Gain', chest: 'Chest & Core', muscles: 'Muscle Building',
            skip: 'Skip', submit: 'Next Step', alert: 'Alert',
            please_select_at_least_one_fitness_goal: 'Please select at least one goal to continue.'
        };
        return translations[key] || key;
    };

    const [goals, setGoals] = useState<string[]>([]);

    const data = [
        { id: '1', key: 'stress_relief', title: t('stress_relief'), image: require('../../../assets/icon.png') },
        { id: '2', key: 'flexibility', title: t('flexibility'), image: require('../../../assets/icon.png') },
        { id: '3', key: 'weight_loss', title: t('weight_loss'), image: require('../../../assets/icon.png') },
        { id: '4', key: 'weight_gain', title: t('weight_gain'), image: require('../../../assets/icon.png') },
        { id: '5', key: 'chest', title: t('chest'), image: require('../../../assets/icon.png') },
        { id: '6', key: 'muscles', title: t('muscles'), image: require('../../../assets/icon.png') },
    ];

    // 👉 ANIMATIONS & TOAST (Same as previous steps)
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const [toastConfig, setToastConfig] = useState({ visible: false, message: '', description: '', type: 'success' });
    const toastAnimY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
        ]).start();
    }, []);

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

    const handleCardPress = async (goalKey: string) => {
        const updatedGoals = goals.includes(goalKey) ? goals.filter(g => g !== goalKey) : [...goals, goalKey];
        setGoals(updatedGoals);
        await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
    };

    const handleNext = async () => {
        if (goals.length === 0) return showToast({ message: t('alert'), description: t('please_select_at_least_one_fitness_goal'), type: "warning" });
        router.push({ pathname: '/(auth)/signup/final', params: { signupData: JSON.stringify({ ...signupData, goals }) } });
    };

    return (
        <SafeAreaView style={{ flex: 1 }} className="bg-sand" edges={['bottom', 'top']}>
            <Stack.Screen options={{ headerStyle: { backgroundColor: 'transparent' }, headerShadowVisible: false, title: '' }} />

            {/* 👉 TOAST UI */}
            <Animated.View className={`absolute w-[90%] self-center p-4 rounded-xl border z-50 shadow-lg ${getToastColor()}`} style={{ transform: [{ translateY: toastAnimY }] }}>
                <Text className="text-white font-bold text-base">{toastConfig.message}</Text>
                {toastConfig.description && <Text className="text-white font-medium text-sm mt-1">{toastConfig.description}</Text>}
            </Animated.View>

            <Animated.View className="flex-1 w-full max-w-2xl self-center px-4 pt-4" style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                <View className="mb-6 items-center px-4">
                    <Text className="text-ink text-3xl font-bold text-center mb-2">{t('select_your_fitness_goals')}</Text>
                    <Text className="text-muted text-base text-center">{t('understand_you')}</Text>
                </View>

                <FlatList
                    key={numColumns}
                    data={data}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    renderItem={({ item }) => {
                        const isSelected = goals.includes(item.key);
                        return (
                            <TouchableOpacity onPress={() => handleCardPress(item.key)} activeOpacity={0.8} className={`flex-1 m-2 rounded-2xl overflow-hidden border-2 relative ${isSelected ? 'border-brand' : 'border-transparent'}`}>
                                <Image source={item.image} className="w-full h-[140px]" resizeMode="cover" />
                                {isSelected && (
                                    <View className="absolute top-2 left-2 bg-brand border-2 border-white rounded-full w-7 h-7 items-center justify-center">
                                        <MaterialIcons name="check" size={16} color="white" />
                                    </View>
                                )}
                                <View className={`p-3 items-center justify-center ${isSelected ? 'bg-brand' : 'bg-surface'}`}>
                                    <Text className={`text-sm font-semibold text-center ${isSelected ? 'text-white' : 'text-ink'}`}>{item.title}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />

                {/* 👉 ACTION BUTTONS */}
                <View className="flex-row justify-between pb-2 gap-3 mt-4">
                    <TouchableOpacity className="flex-1 h-14 rounded-full border border-ink/10 items-center justify-center" onPress={() => router.replace('/(tabs)')}>
                        <Text className="text-muted text-base font-semibold">{t('skip')}</Text>
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Button label={t('submit')} onPress={handleNext} />
                    </View>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}