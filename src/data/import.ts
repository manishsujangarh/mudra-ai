import { Mudra } from "@/types";
import { uuid } from "@/lib/utils";

import seed from "./seed-mudras.json";

/**
 * Data Import System
 * ------------------
 * Normalizes arbitrary JSON (bundled seed OR a remote source) into validated
 * Mudra records and upserts them. Duplicate prevention is handled at the
 * repository layer by matching on `slug`.
 */

/** Loosely-typed incoming record (remote sources may be messy). */
interface RawMudra {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  benefits?: string[] | string;
  instructions?: string[] | string;
  duration?: number | string;
  category?: string;
  image_url?: string | null;
  imageUrl?: string | null;
  source_url?: string | null;
  sourceUrl?: string | null;
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\n|•|•|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Validate & normalize a single raw record. Returns null if unusable. */
export function normalizeMudra(raw: RawMudra): Mudra | null {
  const name = (raw.name ?? "").trim();
  if (!name) return null;

  const slug = (raw.slug && slugify(raw.slug)) || slugify(name);
  if (!slug) return null;

  const durationRaw = raw.duration;
  let duration = 10;
  if (typeof durationRaw === "number" && durationRaw > 0) duration = durationRaw;
  else if (typeof durationRaw === "string") {
    const n = parseInt(durationRaw, 10);
    if (!Number.isNaN(n) && n > 0) duration = n;
  }

  return {
    id: raw.id?.trim() || `mudra-${slug}`,
    name,
    slug,
    description: (raw.description ?? "").trim(),
    benefits: toList(raw.benefits),
    instructions: toList(raw.instructions),
    duration,
    category: (raw.category ?? "general").trim().toLowerCase() || "general",
    imageUrl: raw.image_url ?? raw.imageUrl ?? null,
    sourceUrl: raw.source_url ?? raw.sourceUrl ?? null,
  };
}

/** Normalize a JSON array, dropping unusable entries and de-duping by slug. */
export function normalizeMudraList(rawList: unknown): Mudra[] {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set<string>();
  const out: Mudra[] = [];
  for (const raw of rawList) {
    const m = normalizeMudra(raw as RawMudra);
    if (!m) continue;
    if (seen.has(m.slug)) continue;
    seen.add(m.slug);
    out.push(m);
  }
  return out;
}

/** The bundled offline dataset, normalized and ready to seed. */
export function getSeedMudras(): Mudra[] {
  return normalizeMudraList(seed);
}

/** Stable hash of a dataset, used to skip no-op syncs. */
export function hashMudras(mudras: Mudra[]): string {
  const basis = mudras
    .map(
      (m) =>
        `${m.slug}:${m.name}:${m.duration}:${m.imageUrl ?? ""}:${m.benefits.join("|")}`
    )
    .sort()
    .join("§");
  // djb2
  let hash = 5381;
  for (let i = 0; i < basis.length; i++) {
    hash = (hash * 33) ^ basis.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/** Generate an id for any new mudra created at runtime (rare). */
export function newMudraId(): string {
  return `mudra-${uuid()}`;
}
