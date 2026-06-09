/**
 * Shared domain types. These mirror the SQLite schema (see src/db/schema.ts).
 *
 * Storage note: list-like fields (benefits, instructions) are stored in SQLite as
 * JSON-encoded TEXT columns and parsed into string[] at the repository boundary,
 * so the rest of the app always works with rich types.
 */

export interface Mudra {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string[];
  instructions: string[];
  /** Recommended practice duration in minutes. */
  duration: number;
  category: string;
  imageUrl: string | null;
  sourceUrl: string | null;
}

/** Shape as imported from JSON / persisted in SQLite (lists are JSON strings). */
export interface MudraRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string; // JSON string[]
  instructions: string; // JSON string[]
  duration: number;
  category: string;
  image_url: string | null;
  source_url: string | null;
}

export interface Routine {
  id: string;
  mudraId: string;
  /** "HH:mm" 24h local time. */
  reminderTime: string;
  /** Per-session duration in minutes. */
  duration: number;
  /** ISO date string (YYYY-MM-DD). */
  startDate: string;
  streak: number;
  /** Expo notification identifier, so we can cancel/reschedule. */
  notificationId: string | null;
  active: boolean;
}

export interface RoutineWithMudra extends Routine {
  mudra: Mudra;
}

export interface Session {
  id: string;
  routineId: string;
  completed: boolean;
  /** ISO datetime, null until completed. */
  completedAt: string | null;
}

export interface UserPreferences {
  /** "HH:mm" preferred practice time. */
  preferredTime: string | null;
  wellnessGoal: WellnessGoal | null;
  onboardingCompleted: boolean;
  /** One-time purchase to remove ads from the app. */
  adsRemoved: boolean;
}

export type WellnessGoal =
  | "anxiety"
  | "stress"
  | "sleep"
  | "energy"
  | "focus"
  | "general";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Mudras the assistant referenced (for "recommend" cards). */
  recommendedMudraIds?: string[];
  suggestedDuration?: number;
  createdAt: number;
}

/** Result of the RAG recommendation pipeline. */
export interface Recommendation {
  mudra: Mudra;
  reason: string;
  suggestedDuration: number;
  score: number;
}
