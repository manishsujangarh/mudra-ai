import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Text, TextInput, View } from "react-native";

import { MudraCard } from "@/components/MudraCard";
import { Chip, EmptyState, Screen, SectionTitle } from "@/components/ui";
import { useCategories, useFilteredMudras, useMudras } from "@/hooks/useMudras";
import { useAppStore } from "@/store/useAppStore";

export default function Search() {
  const router = useRouter();
  const { data: results = [], isLoading } = useFilteredMudras();
  const { data: categories = [] } = useCategories();
  const { data: allMudras = [] } = useMudras();

  const searchQuery = useAppStore((s) => s.searchQuery);
  const selectedCategory = useAppStore((s) => s.selectedCategory);
  const selectedBenefit = useAppStore((s) => s.selectedBenefit);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setSelectedCategory = useAppStore((s) => s.setSelectedCategory);
  const setSelectedBenefit = useAppStore((s) => s.setSelectedBenefit);

  // Derive a curated set of benefit filters from the catalogue.
  const benefitFilters = useMemo(() => {
    const keywords = ["anxiety", "stress", "sleep", "energy", "focus", "digestion"];
    const present = new Set<string>();
    for (const m of allMudras) {
      const joined = m.benefits.join(" ").toLowerCase();
      keywords.forEach((k) => {
        if (joined.includes(k)) present.add(k);
      });
    }
    return [...present];
  }, [allMudras]);

  return (
    <Screen>
      <View className="px-5 pt-3">
        <Text className="text-2xl font-bold text-ink">Explore Mudras</Text>

        <View className="mt-3 flex-row items-center rounded-2xl bg-white px-4">
          <Text className="text-base">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search mudras or benefits…"
            placeholderTextColor="#9AA8A4"
            className="flex-1 py-3 pl-2 text-base text-ink"
          />
        </View>

        {benefitFilters.length > 0 && (
          <View className="mt-3">
            <SectionTitle>Filter by benefit</SectionTitle>
            <View className="flex-row flex-wrap">
              {benefitFilters.map((b) => (
                <Chip
                  key={b}
                  label={b}
                  active={selectedBenefit === b}
                  onPress={() =>
                    setSelectedBenefit(selectedBenefit === b ? null : b)
                  }
                />
              ))}
            </View>
          </View>
        )}

        {categories.length > 0 && (
          <View className="mt-1">
            <SectionTitle>Filter by category</SectionTitle>
            <View className="flex-row flex-wrap">
              {categories.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={selectedCategory === c}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === c ? null : c)
                  }
                />
              ))}
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        renderItem={({ item }) => (
          <MudraCard
            mudra={item}
            onPress={() => router.push(`/mudra/${item.slug}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="No matching mudras"
              subtitle="Try clearing your filters or a different search."
            />
          )
        }
      />
    </Screen>
  );
}
