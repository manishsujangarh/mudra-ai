import React from 'react';
import { Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import mudrasData from '../../src/data/seed-mudras.json';
import { useTranslation } from 'react-i18next';

export default function MudraListScreen() {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <ScrollView
            className="flex-1 bg-sand px-5 pt-16"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            <Text className="text-3xl font-bold text-ink mb-6">
                {t("Choose Mudra")}
            </Text>

            {mudrasData.map((mudra) => (
                <Pressable
                    key={mudra.id}
                    onPress={() => router.push(`/verify-mudra/${mudra.id}`)}
                    className="bg-surface border border-surface-light p-5 rounded-2xl mb-4 shadow-sm active:opacity-70"
                >
                    <Text className="text-xl font-bold text-ink mb-1">
                        {t(mudra.name)}
                    </Text>
                    <Text className="text-sm text-muted leading-5" numberOfLines={2}>
                        {t(mudra.description)}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    );
}