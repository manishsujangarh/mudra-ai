import { useCallback } from "react";

import { recommendForCondition } from "@/ai/recommend";
import { useAppStore } from "@/store/useAppStore";
import { useChatStore } from "@/store/useChatStore";

/**
 * Drives the AI chat: appends the user message, runs the RAG pipeline against
 * local SQLite, then appends the assistant reply with any recommendation.
 */
export function useChat() {
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addAssistantMessage = useChatStore((s) => s.addAssistantMessage);
  const setThinking = useChatStore((s) => s.setThinking);
  const setPendingRecommendation = useAppStore(
    (s) => s.setPendingRecommendation
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      addUserMessage(trimmed);
      setThinking(true);
      try {
        const result = await recommendForCondition(trimmed);
        addAssistantMessage(result.reply, {
          recommendedMudraIds: result.recommendation
            ? [result.recommendation.mudra.id]
            : undefined,
          suggestedDuration: result.recommendation?.suggestedDuration,
        });
        // Make the top recommendation available to the routine builder.
        setPendingRecommendation(result.recommendation);
      } catch {
        addAssistantMessage(
          "Something went wrong finding a mudra. Please try again."
        );
      } finally {
        setThinking(false);
      }
    },
    [addUserMessage, addAssistantMessage, setThinking, setPendingRecommendation]
  );

  return { send };
}
