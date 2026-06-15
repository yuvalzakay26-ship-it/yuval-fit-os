// Photo-first nutrition logging — SERVER-ONLY AI adapter (Phase 3.xx).
//
// ⚠️  This module must never be imported by a client component. It reads the
//     secret API key from a server-only env var and performs the vision call.
//     The browser only ever talks to `/api/nutrition/analyze-photo`.
//
// Design notes:
//   • Provider is isolated behind `analyzePhoto()` so it can be swapped later
//     (e.g. to the Vercel AI Gateway) without touching the route or the UI.
//   • Implemented with a plain `fetch` to keep zero extra dependencies.
//   • A documented MOCK seam (`NUTRITION_AI_MOCK=1`) returns a deterministic
//     draft so the full flow can be exercised in dev/QA without a real key.
//   • The image bytes are used only for this request and are never stored.
//
// Env vars (server-only — NEVER prefix with NEXT_PUBLIC):
//   NUTRITION_AI_API_KEY   preferred secret key (falls back to ANTHROPIC_API_KEY)
//   NUTRITION_AI_MODEL     vision model id (default: claude-sonnet-4-6)
//   NUTRITION_AI_MOCK      "1" → return a fixture draft, no network call
//
// See `docs/NUTRITION_PHOTO_ASSIST.md`.

import type {
  ConfidenceLevel,
  PhotoAnalyzeResponse,
  PhotoDraft,
  PhotoDraftItem,
  PhotoErrorCode,
  PortionSize,
} from "@/lib/nutrition-photo";
import { ERROR_COPY_HE } from "@/lib/nutrition-photo";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_ITEMS = 12;

function apiKey(): string | undefined {
  return process.env.NUTRITION_AI_API_KEY || process.env.ANTHROPIC_API_KEY;
}

function mockEnabled(): boolean {
  return process.env.NUTRITION_AI_MOCK === "1";
}

/**
 * Whether the photo-scan feature should be offered at all. Read on the server
 * (route + the /nutrition server component) so the UI can hide the scan card
 * cleanly when nothing is configured — no dead CTA, no client secret.
 */
export function isNutritionAiConfigured(): boolean {
  return mockEnabled() || Boolean(apiKey());
}

function fail(error: PhotoErrorCode): PhotoAnalyzeResponse {
  return { ok: false, error, messageHe: ERROR_COPY_HE[error] };
}

/* --------------------------- Normalization -------------------------- */

function clampNumber(value: unknown, min = 0, max = 100_000): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function asConfidence(value: unknown): ConfidenceLevel {
  return value === "high" || value === "low" ? value : "medium";
}

function asPortionSize(value: unknown): PortionSize {
  return value === "small" || value === "large" ? value : "regular";
}

function normalizeItem(raw: unknown): PhotoDraftItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const nameHe = typeof r.nameHe === "string" ? r.nameHe.trim() : "";
  if (!nameHe) return null;
  const portionSize = asPortionSize(r.portionSize);
  const estPortion =
    typeof r.estPortion === "string" && r.estPortion.trim()
      ? r.estPortion.trim()
      : "מנה רגילה";
  const item: PhotoDraftItem = {
    nameHe,
    estPortion,
    portionSize,
    calories: clampNumber(r.calories),
    protein: clampNumber(r.protein, 0, 1000),
    carbs: clampNumber(r.carbs, 0, 1000),
    fat: clampNumber(r.fat, 0, 1000),
    confidence: asConfidence(r.confidence),
  };
  if (typeof r.matchedSourceFoodId === "string" && r.matchedSourceFoodId.trim()) {
    item.matchedSourceFoodId = r.matchedSourceFoodId.trim();
  }
  return item;
}

/** Turn the model's raw JSON into a strict, trusted draft (or an error). */
function normalizeDraft(parsed: unknown): PhotoAnalyzeResponse {
  if (!parsed || typeof parsed !== "object") return fail("server_error");
  const p = parsed as Record<string, unknown>;
  const rawItems = Array.isArray(p.items) ? p.items : [];
  const items = rawItems
    .map(normalizeItem)
    .filter((i): i is PhotoDraftItem => i !== null)
    .slice(0, MAX_ITEMS);

  if (items.length === 0) return fail("no_food");

  const draft: PhotoDraft = {
    ok: true,
    overallConfidence: asConfidence(p.overallConfidence),
    items,
  };
  if (typeof p.notes === "string" && p.notes.trim()) {
    draft.notes = p.notes.trim();
  }
  return draft;
}

/* ------------------------------ Prompt ------------------------------ */

const SYSTEM_PROMPT = [
  "You are a nutrition photo estimation assistant for an Israeli fitness tracking app.",
  "Look at the food photo and estimate the foods, portions and macros.",
  "All text fields (nameHe, estPortion, notes) MUST be in Hebrew.",
  "Every value is an ESTIMATE — never claim exactness.",
  "If there is no food in the image, return an empty items array.",
  "Respond with STRICT JSON ONLY — no prose, no markdown, no code fences.",
  "JSON schema:",
  "{",
  '  "overallConfidence": "high" | "medium" | "low",',
  '  "items": [{',
  '    "nameHe": string,            // Hebrew food name',
  '    "estPortion": string,        // Hebrew portion estimate, e.g. "מנה רגילה"',
  '    "portionSize": "small" | "regular" | "large",',
  '    "calories": number,          // kcal estimate for the portion',
  '    "protein": number,           // grams',
  '    "carbs": number,             // grams',
  '    "fat": number,               // grams',
  '    "confidence": "high" | "medium" | "low"',
  "  }],",
  '  "notes": string                // optional, Hebrew, may be omitted',
  "}",
].join("\n");

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (block && typeof block === "object" && (block as { type?: string }).type === "text") {
        return String((block as { text?: string }).text ?? "");
      }
      return "";
    })
    .join("");
}

/** Strip optional ```json fences and parse the first JSON object found. */
function parseModelJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/* ------------------------------- Mock ------------------------------- */

function mockDraft(): PhotoDraft {
  // Deterministic fixture for dev/QA. Mirrors a realistic two-item plate.
  return {
    ok: true,
    overallConfidence: "medium",
    items: [
      {
        nameHe: "חזה עוף בגריל",
        estPortion: "מנה רגילה",
        portionSize: "regular",
        calories: 260,
        protein: 38,
        carbs: 2,
        fat: 11,
        confidence: "high",
      },
      {
        nameHe: "אורז לבן",
        estPortion: "מנה רגילה",
        portionSize: "regular",
        calories: 205,
        protein: 4,
        carbs: 44,
        fat: 1,
        confidence: "medium",
      },
    ],
    notes: "טיוטה לדוגמה — הערכים הם הערכה בלבד.",
  };
}

/* ----------------------------- Analyze ------------------------------ */

export interface AnalyzeInput {
  base64: string;
  mimeType: string;
  mealTypeHint?: string;
}

/**
 * Analyze one food photo and return a normalized draft (or a friendly error).
 * Never throws — all failure paths resolve to a `PhotoError`.
 */
export async function analyzePhoto(
  input: AnalyzeInput,
): Promise<PhotoAnalyzeResponse> {
  if (mockEnabled()) return mockDraft();

  const key = apiKey();
  if (!key) return fail("disabled");

  const model = process.env.NUTRITION_AI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const userText = input.mealTypeHint
      ? `נתח את התמונה. רמז לארוחה: ${input.mealTypeHint}.`
      : "נתח את התמונה.";

    const res = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: input.mimeType,
                  data: input.base64,
                },
              },
              { type: "text", text: userText },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return fail("rate_limited");
      return fail("ai_unavailable");
    }

    const data = (await res.json()) as { content?: unknown };
    const text = extractText(data.content);
    if (!text) return fail("server_error");

    const parsed = parseModelJson(text);
    if (parsed === null) return fail("server_error");

    return normalizeDraft(parsed);
  } catch {
    // Abort (timeout) or network failure — treat as a transient outage.
    return fail("ai_unavailable");
  } finally {
    clearTimeout(timer);
  }
}
