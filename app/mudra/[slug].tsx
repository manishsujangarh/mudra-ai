import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Button, LoadingScreen, SectionTitle } from "@/components/ui";
import { useMudraBySlug } from "@/hooks/useMudras";
import { useAppStore } from "@/store/useAppStore";
import { getMudraImage } from "@/utils/images";
import { AdBanner } from "@/ads/AdBanner";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MudraDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: mudra, isLoading } = useMudraBySlug(slug);
  const setPendingRecommendation = useAppStore(
    (s) => s.setPendingRecommendation
  );

  if (isLoading) return <LoadingScreen />;
  if (!mudra) {
    return (
      <View className="flex-1 items-center justify-center bg-sand">
        <Text className="text-muted">Mudra not found.</Text>
      </View>
    );
  }

  const buildRoutine = () => {
    setPendingRecommendation({
      mudra,
      reason: "Selected from the mudra library.",
      suggestedDuration: mudra.duration,
      score: 0,
    });
    router.push("/routine-builder");
  };

  const imageSource = getMudraImage(mudra.imageUrl);


  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['bottom']}>
      <Stack.Screen options={{ title: mudra.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Image
          source={imageSource ?? undefined}
          contentFit="contain"
          style={{ height: 240, width: "100%" }}
          className="bg-brand-light/30"
        />

        <View className="p-5">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-2xl font-bold text-ink">
              {mudra.name}
            </Text>
            <View className="rounded-full bg-brand/10 px-3 py-1">
              <Text className="text-xs font-medium text-brand">
                {mudra.duration} min
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-xs uppercase tracking-wide text-muted">
            {mudra.category}
          </Text>

          <Text className="mt-4 text-base leading-6 text-ink">
            {mudra.description}
          </Text>

          {mudra.benefits.length > 0 && (
            <View className="mt-6">
              <SectionTitle>Benefits</SectionTitle>
              {mudra.benefits.map((b, i) => (
                <View key={i} className="mb-2 flex-row">
                  <Text className="mr-2 text-brand">✓</Text>
                  <Text className="flex-1 text-sm text-ink">{b}</Text>
                </View>
              ))}
            </View>
          )}

          {mudra.instructions.length > 0 && (
            <View className="mt-6">
              <SectionTitle>How to practice</SectionTitle>
              {mudra.instructions.map((step, i) => (
                <View key={i} className="mb-3 flex-row">
                  <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-brand">
                    <Text className="text-xs font-bold text-white">{i + 1}</Text>
                  </View>
                  <Text className="flex-1 text-sm leading-5 text-ink">
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View className="absolute bottom-0 left-0 right-0 border-t border-brand-light/15 bg-sand p-4">
          <Button label="Add to daily routine" onPress={buildRoutine} />
        </View>
      </ScrollView>

      <AdBanner />

    </SafeAreaView>
  );
}
