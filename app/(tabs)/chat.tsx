import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { ChatBubble, TypingBubble } from "@/components/ChatBubble";
import { Screen } from "@/components/ui";
import { useChat } from "@/hooks/useChat";
import { isAiEnabled } from "@/ai/openai";
import { useAppStore } from "@/store/useAppStore";
import { useChatStore } from "@/store/useChatStore";

const QUICK_PROMPTS = [
  "I have anxiety",
  "I'm stressed",
  "I want better sleep",
  "I have low energy",
];

export default function Chat() {
  const router = useRouter();
  const { send } = useChat();
  const messages = useChatStore((s) => s.messages);
  const isThinking = useChatStore((s) => s.isThinking);
  const pendingRec = useAppStore((s) => s.pendingRecommendation);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  const onSend = async (value: string) => {
    setText("");
    await send(value);
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true })
    );
  };

  return (
    <Screen>
      <View className="border-b border-brand-light/15 px-5 py-3">
        <Text className="text-2xl font-bold text-ink">AI Guide ✨</Text>
        <Text className="text-xs text-muted">
          {isAiEnabled()
            ? "Recommends only from your local mudra library (RAG)"
            : "Offline mode · local matching from your library"}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={isThinking ? <TypingBubble /> : null}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Recommendation action card */}
        {pendingRec && (
          <View className="mx-4 mb-2 rounded-2xl border border-brand/30 bg-white p-4">
            <Text className="text-xs uppercase tracking-wide text-muted">
              Recommended
            </Text>
            <Text className="mt-1 text-lg font-bold text-ink">
              {pendingRec.mudra.name}
            </Text>
            <Text className="text-xs text-muted">
              Suggested · {pendingRec.suggestedDuration} min
            </Text>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => router.push(`/mudra/${pendingRec.mudra.slug}`)}
                className="flex-1 items-center rounded-xl border border-brand py-3 active:opacity-80"
              >
                <Text className="font-semibold text-brand">View</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/routine-builder")}
                className="flex-1 items-center rounded-xl bg-brand py-3 active:opacity-80"
              >
                <Text className="font-semibold text-white">Build Routine</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <View className="flex-row flex-wrap px-4 pb-1">
            {QUICK_PROMPTS.map((p) => (
              <Pressable
                key={p}
                onPress={() => onSend(p)}
                className="mr-2 mb-2 rounded-full bg-brand/10 px-3 py-2 active:opacity-70"
              >
                <Text className="text-xs font-medium text-brand">{p}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Composer */}
        <View className="flex-row items-center border-t border-brand-light/15 bg-white px-3 py-2">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Describe how you feel…"
            placeholderTextColor="#9AA8A4"
            className="flex-1 rounded-2xl bg-sand px-4 py-3 text-base text-ink"
            onSubmitEditing={() => onSend(text)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => onSend(text)}
            disabled={!text.trim() || isThinking}
            className={`ml-2 h-11 w-11 items-center justify-center rounded-full ${
              text.trim() ? "bg-brand" : "bg-brand/30"
            }`}
          >
            <Text className="text-lg text-white">↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
