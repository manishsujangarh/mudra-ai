import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, PermissionsAndroid } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MudraCameraView } from '../../modules/mudra-camera';
import mudrasData from '../../src/data/seed-mudras.json';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function MudraVerificationScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation();

    const activeMudra = mudrasData.find(m => m.id === id) || mudrasData[0];

    const [hasPermission, setHasPermission] = useState(false);
    const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
    const [aiStatus, setAiStatus] = useState("Loading...");

    const [isActive, setIsActive] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setIsActive(true);

            return () => {
                setIsActive(false);
            };
        }, [])
    );

    useEffect(() => {
        requestCameraPermission();
    }, []);

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: t("Camera Permission Required"),
                        message: t("We need camera access to analyze your Mudra posture."),
                        buttonPositive: t("OK"),
                        buttonNegative: t("Cancel")
                    }
                );
                setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
            } catch (err) {
                console.warn(err);
            }
        } else {
            setHasPermission(true);
        }
    };

    if (!hasPermission) {
        return (
            <SafeAreaView className="flex-1 bg-surface justify-center items-center px-5">
                <Ionicons name="camera-outline" size={64} color="gray" style={{ marginBottom: 16 }} />
                <Text className="text-ink text-lg text-center mb-6 font-bold">
                    {t("Camera permission is required to analyze your Mudra.")}
                </Text>
                <Pressable
                    className="bg-brand px-6 py-3 rounded-full active:opacity-80 shadow-md"
                    onPress={requestCameraPermission}
                >
                    <Text className="text-white font-bold">{t("Grant Permission")}</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1">

            {isActive && (
                <MudraCameraView
                    style={StyleSheet.absoluteFill}
                    mudraId={activeMudra.id}
                    cameraType={cameraType}
                    onAIStatusChange={(e: any) => setAiStatus(e.nativeEvent.status)}
                />
            )}

            <SafeAreaView className="flex-1 justify-between z-10 pointer-events-box-none">
                <View className="px-4 flex-row justify-between items-center mt-2">
                    <Pressable onPress={() => router.back()} className="w-10 p-2 -ml-2 active:opacity-70">
                        <Ionicons name="arrow-back" size={24} color={Platform.OS === 'ios' ? '#000' : 'gray'} className="dark:color-white" />
                    </Pressable>

                    <View className="bg-surface px-5 py-2 rounded-full opacity-80 shadow-md items-center justify-center flex-shrink mx-2">
                        <Text className="text-ink text-base font-bold text-center" numberOfLines={1}>
                            {t(activeMudra.name)}
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => setCameraType(prev => prev === 'front' ? 'back' : 'front')}
                        className="w-10 active:opacity-70 items-center justify-center"
                    >
                        <Ionicons name="camera-reverse-outline" size={26} color={Platform.OS === 'ios' ? '#000' : 'gray'} className="dark:color-white" />
                    </Pressable>
                </View>

                <View className="mx-4">
                    <View className="bg-surface opacity-80 rounded-2xl p-3 mb-2 shadow-md max-h-48">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-sm font-bold text-ink">{t("steps")}</Text>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {activeMudra.instructions.map((inst, index) => (
                                <View key={index} className="mb-1 flex-row items-start pr-1">
                                    <View className="mr-2 items-center justify-center rounded-full bg-brand/10 border border-brand/20 mt-0.5 w-4 h-4">
                                        <Text className="text-[9px] font-bold text-brand">{index + 1}</Text>
                                    </View>
                                    <Text className="flex-1 text-xs leading-5 text-ink">{t(inst)}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    <View className="bg-surface opacity-80 rounded-2xl p-3 shadow-md items-center">
                        <Text
                            className={`text-lg font-bold text-center ${aiStatus.includes("Perfect") ? "text-green-600" : "text-brand"
                                }`}
                        >
                            {aiStatus}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}