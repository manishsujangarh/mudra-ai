import { Session } from "@/types";
import { daysBetween, todayISODate, uuid } from "@/lib/utils";

import { getDatabase } from "../client";
import { setRoutineStreak } from "./routines";

interface SessionRow {
  id: string;
  routine_id: string;
  completed: number;
  completed_at: string | null;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    routineId: row.routine_id,
    completed: row.completed === 1,
    completedAt: row.completed_at,
  };
}

/**
 * Mark a practice session complete and recompute the routine streak.
 *
 * Streak rules:
 *  - First ever completion -> streak = 1.
 *  - Completed again the next calendar day -> streak + 1.
 *  - Same-day repeat -> streak unchanged (already counted).
 *  - Gap of 2+ days -> streak resets to 1.
 */
export async function completeSession(routineId: string): Promise<{
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

    await db.runAsync(
      `INSERT INTO sessions (id, routine_id, completed, completed_at)
       VALUES (?, ?, 1, ?);`,
      [session.id, routineId, nowISO]
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
