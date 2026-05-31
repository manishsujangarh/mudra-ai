import { Mudra, MudraRow } from "@/types";

import { getDatabase } from "../client";

/** Map a raw SQLite row into a rich Mudra (parsing JSON list columns). */
function rowToMudra(row: MudraRow): Mudra {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    benefits: safeParseList(row.benefits),
    instructions: safeParseList(row.instructions),
    duration: row.duration,
    category: row.category,
    imageUrl: row.image_url,
    sourceUrl: row.source_url,
  };
}

function safeParseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    // Tolerate plain-text fallback (newline / comma separated).
    return value
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export async function countMudras(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM mudras;"
  );
  return row?.c ?? 0;
}

export async function getAllMudras(): Promise<Mudra[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MudraRow>(
    "SELECT * FROM mudras ORDER BY name ASC;"
  );
  return rows.map(rowToMudra);
}

export async function getMudraById(id: string): Promise<Mudra | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MudraRow>(
    "SELECT * FROM mudras WHERE id = ?;",
    [id]
  );
  return row ? rowToMudra(row) : null;
}

export async function getMudraBySlug(slug: string): Promise<Mudra | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MudraRow>(
    "SELECT * FROM mudras WHERE slug = ?;",
    [slug]
  );
  return row ? rowToMudra(row) : null;
}

export async function getCategories(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ category: string }>(
    "SELECT DISTINCT category FROM mudras ORDER BY category ASC;"
  );
  return rows.map((r) => r.category);
}

/**
 * Full-text-ish search across name, description, benefits and category.
 * Used by both the Search screen and the RAG retrieval step.
 */
export async function searchMudras(query: string): Promise<Mudra[]> {
  const db = await getDatabase();
  const q = query.trim();
  if (!q) return getAllMudras();
  const like = `%${q.toLowerCase()}%`;
  const rows = await db.getAllAsync<MudraRow>(
    `SELECT * FROM mudras
     WHERE lower(name) LIKE ?
        OR lower(description) LIKE ?
        OR lower(benefits) LIKE ?
        OR lower(category) LIKE ?
     ORDER BY name ASC;`,
    [like, like, like, like]
  );
  return rows.map(rowToMudra);
}

export async function filterMudras(opts: {
  category?: string;
  benefit?: string;
}): Promise<Mudra[]> {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: string[] = [];
  if (opts.category) {
    clauses.push("category = ?");
    params.push(opts.category);
  }
  if (opts.benefit) {
    clauses.push("lower(benefits) LIKE ?");
    params.push(`%${opts.benefit.toLowerCase()}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await db.getAllAsync<MudraRow>(
    `SELECT * FROM mudras ${where} ORDER BY name ASC;`,
    params
  );
  return rows.map(rowToMudra);
}

/**
 * Upsert a batch of mudras. Existing rows (matched by slug) are updated in
 * place; new rows inserted. Prevents duplicates and preserves the id of
 * existing records. Runs in a single transaction.
 */
export async function upsertMudras(
  mudras: Mudra[],
  now: number = Date.now()
): Promise<{ inserted: number; updated: number }> {
  const db = await getDatabase();
  let inserted = 0;
  let updated = 0;

  await db.withTransactionAsync(async () => {
    for (const m of mudras) {
      const existing = await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM mudras WHERE slug = ?;",
        [m.slug]
      );

      if (existing) {
        await db.runAsync(
          `UPDATE mudras SET
             name = ?, description = ?, benefits = ?, instructions = ?,
             duration = ?, category = ?, image_url = ?, source_url = ?, updated_at = ?
           WHERE slug = ?;`,
          [
            m.name,
            m.description,
            JSON.stringify(m.benefits),
            JSON.stringify(m.instructions),
            m.duration,
            m.category,
            m.imageUrl,
            m.sourceUrl,
            now,
            m.slug,
          ]
        );
        updated += 1;
      } else {
        await db.runAsync(
          `INSERT INTO mudras
             (id, name, slug, description, benefits, instructions, duration, category, image_url, source_url, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            m.id,
            m.name,
            m.slug,
            m.description,
            JSON.stringify(m.benefits),
            JSON.stringify(m.instructions),
            m.duration,
            m.category,
            m.imageUrl,
            m.sourceUrl,
            now,
          ]
        );
        inserted += 1;
      }
    }
  });

  return { inserted, updated };
}
