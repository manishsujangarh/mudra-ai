import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { Mudra } from "@/types";

interface Props {
  mudra: Mudra;
  onPress?: () => void;
  compact?: boolean;
}

const BLUR_HASH = "L6Pj0^jE.AyE_3t7t7R**0o#DgR4";

export function MudraCard({ mudra, onPress, compact }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl bg-surface shadow-sm active:opacity-80"
    >
      <Image
        source={mudra.imageUrl ?? undefined}
        placeholder={BLUR_HASH}
        contentFit="cover"
        transition={200}
        style={{ width: compact ? 72 : 96, height: compact ? 72 : 96 }}
        className="bg-brand-light/20"
      />
      <View className="flex-1 justify-center px-4 py-3">
        <View className="flex-row items-center">
          <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={1}>
            {mudra.name}
          </Text>
          <View className="ml-2 rounded-full bg-sand px-2 py-0.5">
            <Text className="text-[10px] font-medium uppercase text-muted">
              {mudra.category}
            </Text>
          </View>
        </View>
        <Text className="mt-1 text-xs text-muted" numberOfLines={2}>
          {mudra.description}
        </Text>
        {mudra.benefits.length > 0 && !compact && (
          <Text className="mt-1 text-xs text-brand" numberOfLines={1}>
            ✓ {mudra.benefits[0]}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
