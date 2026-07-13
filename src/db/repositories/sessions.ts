import { Session } from "@/types";
import { daysBetween, todayISODate, uuid } from "@/lib/utils";

import { getDatabase } from "../client";
import { setRoutineStreak } from "./routines";

// 1. Updated Row Interface
interface SessionRow {
  id: string;
  routine_id: string;
  completed: number;
  completed_at: string | null;
  pre_mood: string | null;   // 🔥 NEW
  post_mood: string | null;  // 🔥 NEW
}

// 2. Updated Mapper
function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    routineId: row.routine_id,
    completed: row.completed === 1,
    completedAt: row.completed_at,
    preMood: row.pre_mood,   // 🔥 NEW (Make sure to add these to your Session type in "@/types")
    postMood: row.post_mood, // 🔥 NEW
  };
}

/**
 * Mark a practice session complete, save moods, and recompute the routine streak.
 */
export async function completeSession(
  routineId: string,
  preMood?: string | null,   // 🔥 NEW
  postMood?: string | null   // 🔥 NEW
): Promise<{
  session: Session;
  streak: number;
}> {
  const db = await getDatabase();
  const now = new Date();
  const nowISO = now.toISOString();
  const today = todayISODate(now);

  const session: Session = {
    id: uuid(),
    routineId,
    completed: true,
    completedAt: nowISO,
    preMood: preMood ?? null,
    postMood: postMood ?? null,
  };

  let newStreak = 1;

  await db.withTransactionAsync(async () => {
    // Most recent completion for this routine (before inserting the new one).
    const last = await db.getFirstAsync<{ completed_at: string }>(
      `SELECT completed_at FROM sessions
       WHERE routine_id = ? AND completed = 1 AND completed_at IS NOT NULL
       ORDER BY completed_at DESC LIMIT 1;`,
      [routineId]
    );

    const current = await db.getFirstAsync<{ streak: number }>(
      "SELECT streak FROM routines WHERE id = ?;",
      [routineId]
    );
    const currentStreak = current?.streak ?? 0;

    if (last) {
      const lastDate = todayISODate(new Date(last.completed_at));
      const gap = daysBetween(lastDate, today);
      if (gap === 0) {
        newStreak = Math.max(currentStreak, 1); // already counted today
      } else if (gap === 1) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1; // missed a day -> reset
      }
    } else {
      newStreak = 1;
    }

    // 🔥 3. Updated INSERT Query to save moods
    await db.runAsync(
      `INSERT INTO sessions (id, routine_id, completed, completed_at, pre_mood, post_mood)
       VALUES (?, ?, 1, ?, ?, ?);`,
      [session.id, routineId, nowISO, preMood ?? null, postMood ?? null]
    );

    await setRoutineStreak(routineId, newStreak);
  });

  return { session, streak: newStreak };
}

export async function getSessionsForRoutine(
  routineId: string
): Promise<Session[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    "SELECT * FROM sessions WHERE routine_id = ? ORDER BY completed_at DESC;",
    [routineId]
  );
  return rows.map(rowToSession);
}

export async function hasCompletedToday(routineId: string): Promise<boolean> {
  const db = await getDatabase();
  const today = todayISODate();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM sessions
     WHERE routine_id = ? AND completed = 1
       AND date(completed_at) = ?;`,
    [routineId, today]
  );
  return (row?.c ?? 0) > 0;
}

export async function getTotalCompletedSessions(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM sessions WHERE completed = 1;"
  );
  return row?.c ?? 0;
}


export async function getMoodInsights() {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ pre_mood: string, post_mood: string }>(
    `SELECT pre_mood, post_mood FROM sessions 
     WHERE pre_mood IS NOT NULL AND post_mood IS NOT NULL 
     ORDER BY completed_at DESC LIMIT 10;`
  );

  if (rows.length === 0) return null;

  let positiveOutcomes = 0;
  const preMoodCounts: Record<string, number> = {};

  rows.forEach(row => {
    if (["calmer", "lighter", "focused", "sleepy"].includes(row.post_mood)) {
      positiveOutcomes++;
    }

    preMoodCounts[row.pre_mood] = (preMoodCounts[row.pre_mood] || 0) + 1;
  });

  const successRate = Math.round((positiveOutcomes / rows.length) * 100);

  const mostFrequentMood = Object.keys(preMoodCounts).reduce((a, b) =>
    preMoodCounts[a] > preMoodCounts[b] ? a : b
  );

  return {
    successRate,
    mostFrequentMood,
    totalAnalyzed: rows.length
  };
}

export async function getRecentSessions() {
  const db = await getDatabase();

  // SQL JOIN: sessions -> routines -> mudras
  const rows = await db.getAllAsync<{
    id: string;
    completed_at: string;
    pre_mood: string | null;
    post_mood: string | null;
    duration: number;
    mudraName: string;
  }>(
    `SELECT 
      s.id, 
      s.completed_at, 
      s.pre_mood, 
      s.post_mood, 
      r.duration, 
      m.name AS mudraName
    FROM sessions s
    INNER JOIN routines r ON s.routine_id = r.id
    INNER JOIN mudras m ON r.mudra_id = m.id
    WHERE s.completed = 1
    ORDER BY s.completed_at DESC 
    LIMIT 20;` // पिछले 20 सेशंस लाएगा
  );

  // इसे frontend के लिए सही फॉर्मेट में मैप कर देते हैं
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.completed_at,
    preMood: row.pre_mood,
    postMood: row.post_mood,
    duration: row.duration,
    mudraName: row.mudraName,
  }));
}