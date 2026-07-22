import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useAppStore } from "@/store/useAppStore";

// 1. आपके JSON डेटा के हिसाब से इंटरफ़ेस स्ट्रक्चर (CamelCase)
interface MudraData {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string[];
  instructions: string[];
  duration: number;
  category: string;
  imageUrl: string | null;
  sourceUrl: string | null;
}

// क्विक रिलीफ के लिए विशिष्ट मैपिंग (Icon और Color)
interface ReliefMap {
  id: string;
  label: string;
  icon: string;
  color: string;
  mudraId: string;
}

// 📋 पैरेंट (Home.tsx) से आने वाले प्रॉप्स का इंटरफेस
interface QuickReliefWidgetProps {
  routines: any[];
  onStartPractice: (mudraId: string, mudraNameKey: string, duration: number) => Promise<void>;
  isCreating: boolean;
}

const RELIEF_MAPPING: ReliefMap[] = [
  { id: "anxiety_relief", label: "anxiety_relief", icon: "heart-outline", color: "#EF4444", mudraId: "mudra-gyan" },
  { id: "cant_sleep", label: "cant_sleep", icon: "moon-waning-crescent", color: "#3B82F6", mudraId: "mudra-adi" },
  { id: "overthinking_calm", label: "overthinking_calm", icon: "brain", color: "#A855F7", mudraId: "mudra-prana" },
  { id: "low_energy_boost", label: "low_energy_boost", icon: "lightning-bolt-outline", color: "#84CC16", mudraId: "mudra-surya" },
  { id: "digestive_ease", label: "digestive_ease", icon: "stomach", color: "#FF9500", mudraId: "mudra-apana" },
];

export function QuickReliefWidget({ routines, onStartPractice, isCreating }: QuickReliefWidgetProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ग्लोबल स्टोर से एक्शन निकाला (रूटीन बिल्डर में डेटा पुश करने के लिए)
  const setPendingRecommendation = useAppStore((s) => s.setPendingRecommendation);

  const [loading, setLoading] = useState(true);
  const [activeReliefs, setActiveReliefs] = useState<(ReliefMap & { mudraDetails: MudraData })[]>([]);
  const [selectedItem, setSelectedItem] = useState<(ReliefMap & { mudraDetails: MudraData }) | null>(null);

  useEffect(() => {
    const matchMudraData = async () => {
      try {
        setLoading(true);

        const rawMudraJson: MudraData[] = [
          { "id": "mudra-gyan", "name": "mudra-gyan_name", "slug": "gyan-mudra", "description": "mudra-gyan_desc", "benefits": ["mudra-gyan_benefits_1", "mudra-gyan_benefits_2"], "instructions": [], "duration": 15, "category": "cat_meditation", "imageUrl": "../assets/mudras/gyanmudra.webp", "sourceUrl": "" },
          { "id": "mudra-prana", "name": "mudra-prana_name", "slug": "prana-mudra", "description": "mudra-prana_desc", "benefits": [], "instructions": [], "duration": 15, "category": "cat_energy", "imageUrl": "../assets/mudras/pranamudra.webp", "sourceUrl": "" },
          { "id": "mudra-apana", "name": "mudra-apana_name", "slug": "apana-mudra", "description": "mudra-apana_desc", "benefits": [], "instructions": [], "duration": 10, "category": "cat_digestion", "imageUrl": "../assets/mudras/apana.webp", "sourceUrl": "" },
          { "id": "mudra-surya", "name": "mudra-surya_name", "slug": "surya-mudra", "description": "mudra-surya_desc", "benefits": [], "instructions": [], "duration": 12, "category": "cat_energy", "imageUrl": "../assets/mudras/suryamudra.webp", "sourceUrl": "" },
          { "id": "mudra-adi", "name": "mudra-adi_name", "slug": "adi-mudra", "description": "mudra-adi_desc", "benefits": [], "instructions": [], "duration": 10, "category": "cat_sleep", "imageUrl": "../assets/mudras/adimudra.webp", "sourceUrl": "" }
        ];

        const combinedData = RELIEF_MAPPING.map(mapItem => {
          const matchedMudra = rawMudraJson.find(m => m.id === mapItem.mudraId);
          return matchedMudra ? { ...mapItem, mudraDetails: matchedMudra } : null;
        }).filter(Boolean) as (ReliefMap & { mudraDetails: MudraData })[];

        setActiveReliefs(combinedData);
      } catch (error) {
        console.error("Error syncing mudra data:", error);
      } finally {
        setLoading(false);
      }
    };

    matchMudraData();
  }, []);

  const handleLocalStart = async () => {
    if (!selectedItem) return;

    try {
      const targetMudra = selectedItem.mudraDetails;
      await onStartPractice(targetMudra.id, targetMudra.name, targetMudra.duration);
    } catch (error) {
      console.error("Error starting quick relief practice:", error);
    } finally {
      setSelectedItem(null); // प्रोसेस के बाद Modal बंद करें
    }
  };

  // 📝 `MudraDetail` स्क्रीन के लॉजिक के अनुसार स्टोर सिंक करके रूटीन-बिल्डर पर भेजना
  const handleBuildRoutine = () => {
    if (selectedItem) {
      setPendingRecommendation({
        mudra: selectedItem.mudraDetails,
        reason: t("selected_library"),
        suggestedDuration: selectedItem.mudraDetails.duration,
        score: 0,
      });
      router.push("/routine-builder");
      setSelectedItem(null); // प्रोसेस के बाद Modal बंद करें
    }
  };

  return (
    <View className="mt-8">
      {/* --- HEADER --- */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-bold text-ink dark:text-[#F6F1EC]" numberOfLines={1}>
          {t("quick_relief") || "Quick Relief"}
        </Text>
        <Pressable className="active:opacity-70" onPress={() => router.push("/search")}>
          <Text className="text-[11px] text-brand mr-1">{t("see_all") || "See All"}</Text>
        </Pressable>
      </View>

      {/* --- DYNAMIC CONTENT LIST --- */}
      {loading ? (
        <View className="h-[95px] justify-center items-center">
          <ActivityIndicator size="small" color="#FF9500" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        >
          {activeReliefs.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSelectedItem(item)}
              className="bg-surface border border-surface-light dark:bg-[#1A1A1A] dark:border-gray-800 p-3 rounded-2xl items-center w-[85px] h-[95px] justify-center active:opacity-70"
            >
              <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} className="mb-2" />
              <Text className="text-[9px] font-medium text-muted dark:text-gray-400 text-center leading-tight" numberOfLines={1}>
                {t(item.label).replace("\\n", "\n")}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* --- BOTTOM SHEET MODAL --- */}
      <Modal
        visible={!!selectedItem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setSelectedItem(null)}>
          <Pressable
            className="rounded-t-3xl p-6 pb-10 shadow-lg border-t border-transparent dark:border-gray-800"
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: isDark ? "#202322" : "#FFFFFF" }}
          >
            {selectedItem && (
              <>
                {/* क्लोज़ बटन और हैडर */}
                <View className="flex-row justify-between items-center mb-6">
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 rounded-full items-center justify-center bg-surface-light dark:bg-[#1A1A1A]">
                      <MaterialCommunityIcons name={selectedItem.icon as any} size={24} color={selectedItem.color} />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-ink dark:text-[#F6F1EC]">
                        {t(selectedItem.label)}
                      </Text>
                      <Text className="text-sm text-muted dark:text-gray-400">
                        {t(selectedItem.mudraDetails.name)} • {selectedItem.mudraDetails.duration} {t("minutes")}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedItem(null)}
                    disabled={isCreating}
                    className="p-2 bg-surface-light dark:bg-gray-800 rounded-full"
                  >
                    <Ionicons name="close" size={20} color="gray" />
                  </TouchableOpacity>
                </View>

                {/* एक्शन बटन्स */}
                <View className="gap-3">
                  {/* Start Button */}
                  <TouchableOpacity
                    onPress={handleLocalStart}
                    disabled={isCreating}
                    className="bg-brand py-4 rounded-full flex-row justify-center items-center shadow-sm active:opacity-90"
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="play" size={18} color="white" />
                        <Text className="text-white font-bold text-base ml-2">
                          {t("start")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Add to Daily / Build Routine Button */}
                  <TouchableOpacity
                    onPress={handleBuildRoutine}
                    disabled={isCreating}
                    className="bg-surface-light dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 py-4 rounded-full justify-center items-center active:opacity-80"
                  >
                    <Text className="text-ink dark:text-[#F6F1EC] font-bold text-base" numberOfLines={1}>
                      {t("add_daily")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}