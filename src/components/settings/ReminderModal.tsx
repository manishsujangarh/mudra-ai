import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TimePicker } from "@/components/TimePicker";
import { Button } from "@/components/ui";
import { cancelReminder, requestNotificationPermissions, updateNotificationTime } from "@/notifications";

interface ReminderModalProps {
    visible: boolean;
    onClose: () => void;
}

export function ReminderModal({ visible, onClose }: ReminderModalProps) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [time, setTime] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            loadSavedTime();
        }
    }, [visible]);

    const loadSavedTime = async () => {
        const savedTime = await AsyncStorage.getItem("daily_notification_time");
        setTime(savedTime || "07:30");
    };

    const handleSave = async () => {
        if (!time) return;
        setIsSaving(true);
        try {
            const granted = await requestNotificationPermissions();

            const existingId = await AsyncStorage.getItem("last_notif_id");
            if (existingId) {
                await cancelReminder(existingId);
            }

            if (granted) {
                const notifId = await updateNotificationTime({ time: String(time) });
                if (notifId) {
                    await AsyncStorage.setItem("last_notif_id", notifId);
                }
            }

            await AsyncStorage.setItem("daily_notification_time", String(time));
            onClose();

        } catch (error) {
            console.error("Reminder save error:", error);
            Alert.alert(t("error") || "Error", "Could not update reminder. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    className="bg-surface rounded-t-[28px] px-5"
                    style={{ paddingBottom: insets.bottom, maxHeight: "80%" }}
                >
                    {/* Drag Indicator (Pill) */}
                    <View className="w-12 h-1.5 bg-surface-light rounded-full self-center mb-6 mt-3" />

                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xl font-bold text-ink">{t("update_reminder") || "Update Reminder"}</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="p-2 bg-sand rounded-full"
                        >
                            <MaterialIcons name="close" size={20} color="#FF9500" />
                        </TouchableOpacity>
                    </View>

                    {/* Subtitle */}
                    <Text className="text-sm text-muted mb-6">
                        {t("update_reminder_sub") || "Set the time for your daily practice."}
                    </Text>

                    {/* Scrollable Content (Exact match with Music Modal) */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        <View className="mt-2 items-center justify-center min-h-[200px]">
                            {time !== null ? (
                                <TimePicker value={time} onChange={setTime} />
                            ) : (
                                <ActivityIndicator size="large" color="#FF9500" />
                            )}
                        </View>

                        <View className="mt-8 mb-2">
                            <Button
                                label={t("save_changes") || "Save Changes"}
                                onPress={handleSave}
                                loading={isSaving}
                            />
                        </View>
                    </ScrollView>

                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}