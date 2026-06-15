// Photo-first nutrition — server route (Phase 3.xx).
//
// GET  → capability check: { enabled: boolean }. The /nutrition page uses this
//        (via the server component) to decide whether to render the scan card.
// POST → analyze one food photo and return a normalized, EDITABLE draft. The
//        image is used only for this request and is never stored to disk, DB,
//        Supabase or anywhere else.
//
// The secret AI key lives only on the server (see lib/nutrition-ai.ts); it is
// never sent to the client. The body is always the `PhotoAnalyzeResponse`
// discriminated union so the browser reads `ok` + Hebrew copy uniformly.

import { analyzePhoto, isNutritionAiConfigured } from "@/lib/nutrition-ai";
import {
  ACCEPTED_PHOTO_MIME,
  ERROR_COPY_HE,
  MAX_PHOTO_BYTES,
  type PhotoAnalyzeResponse,
  type PhotoCapability,
  type PhotoErrorCode,
} from "@/lib/nutrition-photo";

// Reads env + does network I/O — never prerender or cache it.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorBody(error: PhotoErrorCode): PhotoAnalyzeResponse {
  return { ok: false, error, messageHe: ERROR_COPY_HE[error] };
}

export async function GET(): Promise<Response> {
  const body: PhotoCapability = { enabled: isNutritionAiConfigured() };
  return Response.json(body);
}

export async function POST(request: Request): Promise<Response> {
  if (!isNutritionAiConfigured()) {
    return Response.json(errorBody("disabled"));
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(errorBody("bad_type"));
  }

  const image = form.get("image");
  if (!(image instanceof File)) {
    return Response.json(errorBody("bad_type"));
  }

  const mime = (image.type || "").toLowerCase();
  if (!ACCEPTED_PHOTO_MIME.includes(mime as (typeof ACCEPTED_PHOTO_MIME)[number])) {
    return Response.json(errorBody("bad_type"));
  }
  if (image.size <= 0 || image.size > MAX_PHOTO_BYTES) {
    return Response.json(errorBody("too_large"));
  }

  const mealTypeHint = form.get("mealTypeHint");
  const hint = typeof mealTypeHint === "string" ? mealTypeHint : undefined;

  let base64: string;
  try {
    const buffer = Buffer.from(await image.arrayBuffer());
    base64 = buffer.toString("base64");
  } catch {
    return Response.json(errorBody("server_error"));
  }

  const result = await analyzePhoto({ base64, mimeType: mime, mealTypeHint: hint });
  return Response.json(result);
}
