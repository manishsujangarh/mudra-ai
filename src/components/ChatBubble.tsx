import { Text, View } from "react-native";

import { ChatMessage } from "@/types";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      className={`mb-3 max-w-[82%] ${isUser ? "self-end" : "self-start"}`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-sm bg-brand"
            : "rounded-bl-sm bg-white border border-brand-light/20"
        }`}
      >
        <Text
          className={`text-[15px] leading-5 ${isUser ? "text-white" : "text-ink"}`}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export function TypingBubble() {
  return (
    <View className="mb-3 max-w-[82%] self-start">
      <View className="rounded-2xl rounded-bl-sm border border-brand-light/20 bg-white px-4 py-3">
        <Text className="text-[15px] text-muted">Thinking…</Text>
      </View>
    </View>
  );
}
