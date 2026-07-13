import { Recommendation } from "@/types";
import { clamp } from "@/lib/utils";

import { getModel, getOpenAiClient } from "./openai";
import { ScoredMudra, retrieveRelevantMudras } from "./retrieval";

/**
 * RAG Recommendation Engine
 * -------------------------
 * 1. Retrieve relevant mudras from LOCAL SQLite (retrieval.ts).
 * 2. Send ONLY those retrieved mudras to OpenAI as grounding context.
 * 3. The model must pick from that list and explain why — it can never invent
 *    a mudra. If OpenAI is unavailable, a deterministic local explanation is
 *    produced from the same retrieved set.
 */

export interface ChatResult {
  /** Natural-language reply shown in the chat thread. */
  reply: string;
  /** Structured top recommendation (if any candidates were found). */
  recommendation: Recommendation | null;
  /** All retrieved candidates, best first. */
  candidates: Recommendation[];
  /** Whether OpenAI was actually used (vs. local fallback). */
  usedAi: boolean;
}

function toRecommendation(s: ScoredMudra, reason: string): Recommendation {
  // Suggest a duration nudged by the mudra's own default, clamped to 5–30 min.
  const suggestedDuration = clamp(s.mudra.duration, 5, 30);
  return {
    mudra: s.mudra,
    reason,
    suggestedDuration,
    score: s.score,
  };
}

/** Local, offline explanation built purely from retrieved DB content. */
function localExplain(top: ScoredMudra, condition: string, t: any): string {
  const benefits =
    top.matchedBenefits.length > 0
      ? top.matchedBenefits
      : top.mudra.benefits.slice(0, 3);

  // 💡 Benefits को ट्रांसलेट किया जा रहा है
  const benefitText = benefits.map((b) => `• ${t(b)}`).join("\n");

  return (
    `${t("local_explain_1")} "${condition.trim()}", ${t("local_explain_2")} **${t(top.mudra.name)}**.\n\n` +
    `${t("local_explain_why")}\n${benefitText}\n\n` +
    `${t("local_explain_try")} ${clamp(top.mudra.duration, 5, 30)} ${t("local_explain_mins")}`
  );
}

const SYSTEM_PROMPT = `You are Mudra AI, a calm and supportive yoga-mudra wellness guide.

STRICT RULES:
- You may ONLY recommend mudras from the provided "Available Mudras" list.
- NEVER invent a mudra, benefit, or instruction that is not in the list.
- Choose the single best-matching mudra for the user's described condition.
- Briefly explain WHY it helps, citing the mudra's listed benefits.
- Suggest a practice duration in minutes (use the mudra's listed duration as a guide, 5-30 min).
- Keep the tone warm, concise, and practical. Use the mudra's exact name.
- If the list is empty, say you don't have a matching mudra yet.

Respond in plain text (no markdown headers).`;

interface AiJson {
  mudraSlug?: string;
  reason?: string;
  durationMinutes?: number;
  reply?: string;
}

/**
 * Main entry point used by the chat screen and routine builder.
 */
export async function recommendForCondition(
  condition: string,
  t: any,
  lang: string
): Promise<ChatResult> {
  const scored = await retrieveRelevantMudras(condition, 4);

  if (scored.length === 0) {
    return {
      reply: t("no_matching_mudra") || "I don't have a matching mudra in your library yet. Try syncing your mudra content, then ask again.",
      recommendation: null,
      candidates: [],
      usedAi: false,
    };
  }

  const candidates = scored.map((s) =>
    toRecommendation(s, "Matched on your described condition.")
  );

  const client = getOpenAiClient();

  // ---- Offline / no-key path: deterministic local recommendation ----
  if (!client) {
    const top = scored[0];
    const reply = localExplain(top, condition, t);
    return {
      reply,
      recommendation: toRecommendation(top, reply),
      candidates,
      usedAi: false,
    };
  }

  // ---- RAG path: ground the model on retrieved local mudras only ----
  const context = scored
    .map((s) => {
      const m = s.mudra;
      return [
        `Name: ${t(m.name)}`,
        `Slug: ${m.slug}`,
        `Category: ${t(m.category)}`,
        `Default duration (min): ${m.duration}`,
        `Benefits: ${m.benefits.map(b => t(b)).join("; ")}`,
        `Description: ${t(m.description)}`,
      ].join("\n");
    })
    .join("\n---\n");

  try {
    const completion = await client.chat.completions.create({
      model: getModel(),
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT + `\nIMPORTANT: Write your reply strictly in the language code: '${lang}'.` },
        {
          role: "user",
          content:
            `User condition: "${condition}"\n\n` +
            `Available Mudras (choose ONE by slug):\n${context}\n\n` +
            `Return JSON: {"mudraSlug": string, "reason": string, "durationMinutes": number, "reply": string}. ` +
            `"reply" is the warm message shown to the user.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as AiJson;

    const chosen =
      scored.find((s) => s.mudra.slug === parsed.mudraSlug) ?? scored[0];
    const duration = clamp(
      parsed.durationMinutes && parsed.durationMinutes > 0
        ? parsed.durationMinutes
        : chosen.mudra.duration,
      5,
      30
    );
    const reason = parsed.reason?.trim() || "Matched on your described condition.";
    const reply =
      parsed.reply?.trim() || localExplain(chosen, condition, t);

    const recommendation: Recommendation = {
      mudra: chosen.mudra,
      reason,
      suggestedDuration: duration,
      score: chosen.score,
    };

    return {
      reply,
      recommendation,
      candidates,
      usedAi: true,
    };
  } catch {
    // Any API failure -> graceful local fallback (still grounded in DB).
    const top = scored[0];
    const reply = localExplain(top, condition, t);
    return {
      reply,
      recommendation: toRecommendation(top, reply),
      candidates,
      usedAi: false,
    };
  }
}
