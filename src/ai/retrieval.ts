import { Mudra } from "@/types";
import { getAllMudras, searchMudras } from "@/db/repositories/mudras";

/**
 * RAG Retrieval (the "R")
 * -----------------------
 * Pulls candidate mudras from the LOCAL SQLite database and scores them
 * against the user's free-text condition. This is what guarantees the AI can
 * only ever recommend mudras that actually exist on the device.
 */

/** Condition keywords mapped to the vocabulary used in mudra benefits. */
const CONDITION_SYNONYMS: Record<string, string[]> = {
  anxiety: ["anxiety", "anxious", "panic", "nervous", "worry", "calm", "palpitation"],
  stress: ["stress", "stressed", "tension", "overwhelm", "overthinking", "relax"],
  sleep: ["sleep", "insomnia", "rest", "restful", "bedtime", "relax", "calm"],
  energy: ["energy", "fatigue", "tired", "lethargy", "lethargic", "vitality", "low energy", "sluggish", "stamina"],
  focus: ["focus", "concentration", "clarity", "memory", "brain fog", "attention"],
  depression: ["depression", "low mood", "sad", "mood"],
  digestion: ["digestion", "bloating", "constipation", "detox"],
};

function expandQuery(query: string): string[] {
  const q = query.toLowerCase();
  const terms = new Set<string>();
  // Raw words (length > 2).
  for (const w of q.split(/[^a-z]+/)) {
    if (w.length > 2) terms.add(w);
  }
  // Synonym expansion.
  for (const [key, syns] of Object.entries(CONDITION_SYNONYMS)) {
    if (q.includes(key) || syns.some((s) => q.includes(s))) {
      terms.add(key);
      syns.forEach((s) => terms.add(s));
    }
  }
  return [...terms];
}

export interface ScoredMudra {
  mudra: Mudra;
  score: number;
  matchedBenefits: string[];
}

/** Lexical relevance score of a mudra against expanded query terms. */
function scoreMudra(mudra: Mudra, terms: string[]): ScoredMudra {
  const haystackBenefits = mudra.benefits.map((b) => b.toLowerCase());
  const desc = mudra.description.toLowerCase();
  const name = mudra.name.toLowerCase();
  const category = mudra.category.toLowerCase();

  let score = 0;
  const matched: string[] = [];

  for (const term of terms) {
    // Benefit hits are the strongest signal.
    haystackBenefits.forEach((b, i) => {
      if (b.includes(term)) {
        score += 5;
        if (!matched.includes(mudra.benefits[i])) matched.push(mudra.benefits[i]);
      }
    });
    if (category.includes(term)) score += 3;
    if (name.includes(term)) score += 2;
    if (desc.includes(term)) score += 1;
  }

  return { mudra, score, matchedBenefits: matched };
}

/**
 * Retrieve the top-K most relevant local mudras for a condition.
 * Always returns something (falls back to the full catalogue) so the AI
 * layer never has to invent content.
 */
export async function retrieveRelevantMudras(
  query: string,
  k = 4
): Promise<ScoredMudra[]> {
  const terms = expandQuery(query);

  // Start from a DB-narrowed set when possible, else everything.
  let candidates = await searchMudras(query);
  if (candidates.length === 0) candidates = await getAllMudras();

  const scored = candidates
    .map((m) => scoreMudra(m, terms))
    .sort((a, b) => b.score - a.score);

  const ranked = scored.filter((s) => s.score > 0);
  const result = (ranked.length ? ranked : scored).slice(0, k);
  return result;
}
