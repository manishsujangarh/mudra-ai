import { Mudra, MudraRow, Routine, RoutineWithMudra } from "@/types";
import { todayISODate, uuid } from "@/lib/utils";

import { getDatabase } from "../client";

interface RoutineRow {
  id: string;
  mudra_id: string;
  reminder_time: string;
  duration: number;
  start_date: string;
  streak: number;
  notification_id: string | null;
  active: number;
}

function rowToRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    mudraId: row.mudra_id,
    reminderTime: row.reminder_time,
    duration: row.duration,
    startDate: row.start_date,
    streak: row.streak,
    notificationId: row.notification_id,
    active: row.active === 1,
  };
}

export async function createRoutine(input: {
  mudraId: string;
  reminderTime: string;
  duration: number;
  notificationId?: string | null;
}): Promise<Routine> {
  const db = await getDatabase();
  const routine: Routine = {
    id: uuid(),
    mudraId: input.mudraId,
    reminderTime: input.reminderTime,
    duration: input.duration,
    startDate: todayISODate(),
    streak: 0,
    notificationId: input.notificationId ?? null,
    active: true,
  };
  await db.runAsync(
    `INSERT INTO routines (id, mudra_id, reminder_time, duration, start_date, streak, notification_id, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1);`,
    [
      routine.id,
      routine.mudraId,
      routine.reminderTime,
      routine.duration,
      routine.startDate,
      routine.streak,
      routine.notificationId,
    ]
  );
  return routine;
}

export async function getActiveRoutines(): Promise<RoutineWithMudra[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RoutineRow & MudraRow>(
    `SELECT r.*, m.id AS m_id, m.name, m.slug, m.description, m.benefits,
            m.instructions, m.duration AS m_duration, m.category, m.image_url, m.source_url
     FROM routines r
     JOIN mudras m ON m.id = r.mudra_id
     WHERE r.active = 1
     ORDER BY r.reminder_time ASC;`
  );
  return rows.map((row: any) => joinRow(row));
}

export async function getRoutineById(
  id: string
): Promise<RoutineWithMudra | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT r.*, m.id AS m_id, m.name, m.slug, m.description, m.benefits,
            m.instructions, m.duration AS m_duration, m.category, m.image_url, m.source_url
     FROM routines r
     JOIN mudras m ON m.id = r.mudra_id
     WHERE r.id = ?;`,
    [id]
  );
  return row ? joinRow(row) : null;
}

function joinRow(row: any): RoutineWithMudra {
  const mudra: Mudra = {
    id: row.m_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    benefits: parseList(row.benefits),
    instructions: parseList(row.instructions),
    duration: row.m_duration,
    category: row.category,
    imageUrl: row.image_url,
    sourceUrl: row.source_url,
  };
  return { ...rowToRoutine(row), mudra };
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function setRoutineStreak(
  id: string,
  streak: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE routines SET streak = ? WHERE id = ?;", [
    streak,
    id,
  ]);
}

export async function setRoutineNotification(
  id: string,
  notificationId: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE routines SET notification_id = ? WHERE id = ?;", [
    notificationId,
    id,
  ]);
}

export async function deactivateRoutine(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE routines SET active = 0 WHERE id = ?;", [id]);
}
