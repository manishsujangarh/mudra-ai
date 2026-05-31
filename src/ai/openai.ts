import Constants from "expo-constants";
import OpenAI from "openai";

/**
 * OpenAI client factory.
 *
 * The key is read from EXPO_PUBLIC_OPENAI_API_KEY (or app.json extra). If no
 * key is present the app still works — the recommendation engine falls back to
 * a fully local, deterministic explanation (see ai/recommend.ts).
 *
 * SECURITY: embedding a key in a client bundle exposes it. For production,
 * point `baseURL` at your own serverless proxy and leave the key blank.
 */

export function getOpenAiKey(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const fromExtra = (Constants.expoConfig?.extra as any)?.openAiApiKey;
  const key = (fromEnv || fromExtra || "").trim();
  return key.length > 0 ? key : null;
}

export function getModel(): string {
  return process.env.EXPO_PUBLIC_OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI | null {
  const key = getOpenAiKey();
  if (!key) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: key,
      // React Native has no browser security context; this acknowledges that.
      dangerouslyAllowBrowser: true,
    });
  }
  return client;
}

export function isAiEnabled(): boolean {
  return getOpenAiKey() !== null;
}
