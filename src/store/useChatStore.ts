import { create } from "zustand";

import { ChatMessage } from "@/types";
import { uuid } from "@/lib/utils";

/** In-memory chat thread state. Cleared on app restart by design. */

interface ChatState {
  messages: ChatMessage[];
  isThinking: boolean;
  addUserMessage: (content: string) => ChatMessage;
  addAssistantMessage: (
    content: string,
    extra?: Partial<Pick<ChatMessage, "recommendedMudraIds" | "suggestedDuration">>
  ) => ChatMessage;
  setThinking: (thinking: boolean) => void;
  reset: () => void;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Namaste 🙏 Tell me what you're feeling — for example \"I have anxiety\", \"I'm stressed\", \"I want better sleep\", or \"I have low energy\" — and I'll suggest a mudra from your library.",
  createdAt: 0,
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [WELCOME],
  isThinking: false,

  addUserMessage: (content) => {
    const msg: ChatMessage = {
      id: uuid(),
      role: "user",
      content,
      createdAt: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  addAssistantMessage: (content, extra) => {
    const msg: ChatMessage = {
      id: uuid(),
      role: "assistant",
      content,
      createdAt: Date.now(),
      ...extra,
    };
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  setThinking: (isThinking) => set({ isThinking }),
  reset: () => set({ messages: [WELCOME], isThinking: false }),
}));
