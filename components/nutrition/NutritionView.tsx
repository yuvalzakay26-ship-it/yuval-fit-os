"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sumNutrition, todaysFoodLogs } from "@/lib/analytics";
import {
  getRecentFoodEntries,
  duplicateFoodLogForToday,
} from "@/lib/nutrition-reuse";
import {
  addFoodLog,
  removeFoodLog,
  useFavoriteFoods,
  useFoodLogs,
  useSettings,
} from "@/lib/fitness-store";
import type { FoodLog } from "@/lib/fitness-types";
import type { FoodCategory } from "@/lib/food-library";
import { foodById } from "@/lib/food-library";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, SectionHeader } from "@/components/ui/PageHeader";
import {
  AppleIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronIcon,
  DatabaseIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  StarIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { WaterCard } from "@/components/water/WaterCard";
import { SupplementsCard } from "@/components/supplements/SupplementsCard";
import { FoodImage } from "./FoodImage";
import { MacroSummary } from "./MacroSummary";
import { PhotoScanCard, PhotoScanCardDisabled } from "./PhotoScanCard";
import { ProteinCalculator } from "./ProteinCalculator";
import { cn } from "@/lib/utils";
import { MEAL_TYPE_LABELS } from "./nutrition-labels";

/** Compact macro line, e.g. "18 חלבון · 30 פחמ׳ · 12 שומן". */
function macroLine(log: FoodLog): string {
  return `${Math.round(log.protein)} חלבון · ${Math.round(log.carbs)} פחמ׳ · ${Math.round(log.fat)} שומן`;
}

export function NutritionView({
  aiEnabled,
  showSetupHint = false,
}: {
  /** Whether server-side AI is configured — gates active vs coming-soon scan card. */
  aiEnabled: boolean;
  /** Dev/admin-only "feature ready, no key yet" helper on the disabled card. */
  showSetupHint?: boolean;
}) {
  const logs = useFoodLogs();
  const settings = useSettings();
  const favorites = useFavoriteFoods();

  const today = todaysFoodLogs(logs);
  const totals = sumNutrition(today);
  // "אכלת לאחרונה" — recent unique foods derived purely from the log history.
  const recents = getRecentFoodEntries(logs);

  // Calm, transient success feedback for "הוסף שוב" and photo saves. One small
  // toast, announced politely, auto-dismissed; component-local only.
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const showFlash = useCallback((message: string) => {
    setFlash(message);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2200);
  }, []);

  const addAgain = useCallback(
    (entry: FoodLog) => {
      // Duplicate into today's journal: a new id + today's date, original intact.
      addFoodLog(duplicateFoodLogForToday(entry));
      showFlash("נוסף ליומן של היום");
    },
    [showFlash],
  );

  // "הוסף שוב" is the fast, no-AI fallback: it reveals the recent foods so a
  // known meal is one tap. Recents folded into this action keeps the page calm.
  const [showRecents, setShowRecents] = useState(true);
  const hasRecents = recents.length > 0;

  // Resolve favorite ids to library items (newest first), dropping any whose
  // source food no longer exists. Capped to keep the Nutrition screen compact.
  const favoriteFoods = Object.values(favorites)
    .sort((a, b) => (a.addedAt < b.addedAt ? 1 : a.addedAt > b.addedAt ? -1 : 0))
    .map((fav) => foodById(fav.sourceFoodId))
    .filter((item) => item !== undefined)
    .slice(0, 6);

  const handleDelete = (id: string) => removeFoodLog(id);

  return (
    <div className="space-y-6">
      {/* 1 — "תזונה היום": the daily status snapshot (what was logged today). */}
      <section>
        <SectionHeader
          title="תזונה היום"
          hint="סיכום מה שנרשם היום"
          accent="var(--accent-nutrition)"
        />
        <MacroSummary
          totals={totals}
          proteinGoal={settings.proteinGoal}
          calorieGoal={settings.calorieGoal}
        />
      </section>

      {/* 2 — "הוספה ליומן": one calm command area with exactly THREE ways to add
          what you actually ate — manual, from a recipe, and (future) value
          extraction from an image/text. The catalog quick-add lives lower, as a
          quieter helper, so this area stays uncluttered. The extractor is the
          active card when AI is configured, otherwise the inert "בקרוב"
          placeholder — it never blocks the two always-working actions above. */}
      <section>
        <SectionHeader
          title="הוספה ליומן"
          hint="בחר איך לרשום מה שאכלת בפועל"
          accent="var(--accent-nutrition)"
        />

        {/* The two reliable, always-working actions, equal weight. */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/nutrition/add"
            className="tap flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-right shadow-soft transition-[border-color] hover:border-border-strong"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
              <PencilIcon className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-foreground">הוסף ידנית</span>
            <span className="text-[11.5px] leading-snug text-muted">
              הזנה חופשית של שם וערכים
            </span>
          </Link>

          <Link
            href="/recipes"
            className="tap flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-right shadow-soft transition-[border-color] hover:border-border-strong"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
              <BookOpenIcon className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-bold text-foreground">הוסף ממתכון</span>
            <span className="text-[11.5px] leading-snug text-muted">
              מתכון עם ערכים מוכנים מראש
            </span>
          </Link>
        </div>

        {/* The third action: value extraction from an image/text. Active flow when
            AI is on, inert "בקרוב" placeholder otherwise — extraction only, never
            advice, and nothing is saved without the user's confirmation. */}
        <div className="mt-2.5">
          {aiEnabled ? (
            <PhotoScanCard
              hasRecents={hasRecents}
              onSaved={() => showFlash("נוסף ליומן של היום")}
            />
          ) : (
            <PhotoScanCardDisabled showSetupHint={showSetupHint} />
          )}
        </div>
        {/* AI helper link — only when the extractor is live; estimate-only framing. */}
        {aiEnabled && (
          <p className="mt-2 text-center text-[12px] text-muted">
            <Link
              href="/ai-disclaimer"
              className="tap font-semibold text-accent underline"
            >
              איך עובד חילוץ הערכים?
            </Link>
          </p>
        )}

        {/* Quiet reassurance: this area only logs what you ate, and it stays on
            your device. Reinforces the "log, don't advise" product principle. */}
        <p className="mt-3 text-center text-[11.5px] leading-snug text-faint">
          יומן התזונה הוא המקום שבו נשמר מה שאכלת בפועל. הנתונים נשמרים במכשיר שלך.
        </p>
      </section>

      {/* 3 — "יומן היום": the source of truth for what was logged today. The
          "הוסף שוב" recents shortcut lives here (next to the history it draws
          from) and only when there are recents, so the empty state stays calm. */}
      <section>
        <SectionHeader title={`יומן האוכל של היום${today.length ? ` · ${today.length}` : ""}`} />

        {/* Shortcut: "הוסף שוב" reveals recent foods — a quick re-log from history.
            Quiet + full-width, and shown only when there is something to reveal. */}
        {hasRecents && (
          <>
            <button
              type="button"
              onClick={() => setShowRecents((v) => !v)}
              aria-expanded={showRecents}
              className="tap mb-3 flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-right shadow-soft transition-[border-color] hover:border-border-strong"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
                <RefreshIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-foreground">הוסף שוב</span>
                <span className="block text-[11.5px] leading-snug text-muted">
                  מהארוחות האחרונות שלך
                </span>
              </span>
              <ChevronDownIcon
                className={cn(
                  "h-4 w-4 shrink-0 text-faint transition-transform",
                  showRecents && "rotate-180",
                )}
              />
            </button>

            {/* Recent foods, revealed under "הוסף שוב". Derived from log history;
                the macros are exactly what the user entered before — nothing
                inferred. */}
            {showRecents && (
              <div className="no-scrollbar -mx-4 mb-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
                {recents.map((food) => (
                  <Card
                    key={food.id}
                    className="flex w-[208px] shrink-0 flex-col gap-2.5 p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <FoodImage
                        imagePath={food.imagePath}
                        alt={food.foodName}
                        category={(food.category || "other") as FoodCategory}
                        label={food.foodName}
                        sizes="40px"
                        className="h-10 w-10 shrink-0 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold text-foreground">
                          {food.foodName}
                        </p>
                        <Badge tone="muted">{MEAL_TYPE_LABELS[food.mealType]}</Badge>
                      </div>
                    </div>
                    <p className="text-[11.5px] leading-snug text-muted">
                      {food.quantityText && (
                        <span className="text-faint">{food.quantityText} · </span>
                      )}
                      {food.calories ? (
                        <span className="font-semibold text-[color:var(--accent-nutrition)]">
                          {Math.round(food.calories)} קל׳
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] leading-snug text-faint">{macroLine(food)}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-auto w-full"
                      onClick={() => addAgain(food)}
                    >
                      <PlusIcon className="h-4 w-4" /> הוסף שוב
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        {today.length === 0 ? (
          <EmptyState
            accent="var(--accent-nutrition)"
            accentSoft="var(--accent-nutrition-soft)"
            icon={<AppleIcon className="h-7 w-7" />}
            title="עדיין לא נרשם אוכל היום"
            description="הוסף ארוחה כדי להתחיל לעקוב — פעולות ההוספה נמצאות למעלה."
          />
        ) : (
          <div className="space-y-2.5">
            {today.map((log) => (
              <Card key={log.id} className="flex items-center gap-3 p-3.5">
                {log.imagePath && (
                  <FoodImage
                    imagePath={log.imagePath}
                    alt={log.foodName}
                    category={(log.category || "other") as FoodCategory}
                    label={log.foodName}
                    sizes="44px"
                    className="h-11 w-11 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-bold text-foreground">
                      {log.foodName}
                    </p>
                    <Badge tone="muted">{MEAL_TYPE_LABELS[log.mealType]}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">
                    {log.quantityText && (
                      <span className="text-faint">{log.quantityText} · </span>
                    )}
                    <span className="font-semibold text-[color:var(--accent-nutrition)]">
                      {Math.round(log.protein)}ג
                    </span>{" "}
                    חלבון · {Math.round(log.carbs)}ג פחמ׳ · {Math.round(log.fat)}ג שומן
                    {log.calories ? ` · ${Math.round(log.calories)} קל׳` : ""}
                  </p>
                </div>
                <button
                  onClick={() => addAgain(log)}
                  className="tap flex h-9 shrink-0 items-center gap-1 rounded-xl border border-border px-2.5 text-[12px] font-semibold text-[color:var(--accent-nutrition)] hover:border-border-strong"
                  aria-label={`הוסף שוב — ${log.foodName}`}
                >
                  <PlusIcon className="h-4 w-4" /> הוסף שוב
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="tap -m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-surface-2 hover:text-red-500"
                  aria-label="מחיקת פריט"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 4 — "ספריית מתכונים": a single calm entry card to /recipes. The recipe
          list is NOT duplicated here — this just points to the library, the
          "ready source with known values" concept. */}
      <section>
        <SectionHeader title="ספריית מתכונים" accent="var(--accent-nutrition)" />
        <Link
          href="/recipes"
          className="tap flex items-center gap-3.5 rounded-2xl border border-border bg-surface-raised p-4 shadow-soft transition-[border-color] hover:border-border-strong"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
            <BookOpenIcon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-foreground">
              פתח ספריית מתכונים
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug text-muted">
              מתכוני חלבון ומתוקים עם ערכים מוכנים שאפשר להוסיף ליומן.
            </span>
          </span>
          <ChevronIcon className="h-4 w-4 shrink-0 rotate-180 text-faint" />
        </Link>
      </section>

      {/* E — Food shortcuts: favorited foods as compact chips. A quick re-add,
          secondary to the journal — identity only, no macros stored/inferred
          here (see docs/NUTRITION_FAVORITES.md). Hidden entirely when empty so
          it never reads as a main content area. */}
      {favoriteFoods.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
              <StarIcon filled className="h-3.5 w-3.5 text-amber-400" />
              מועדפים
            </p>
            <Link
              href="/nutrition/library?view=favorites"
              className="tap text-[12px] font-semibold text-[color:var(--accent-nutrition)]"
            >
              הצג הכל
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {favoriteFoods.map((food) => (
              <Link
                key={food.id}
                href={`/nutrition/add?foodId=${encodeURIComponent(food.id)}`}
                className="tap flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface py-1.5 pe-3 ps-1.5 text-[12.5px] font-semibold text-foreground hover:border-border-strong"
              >
                <FoodImage
                  imagePath={food.imagePath}
                  alt={food.nameHe}
                  category={food.category}
                  label={food.nameHe}
                  sizes="28px"
                  className="h-7 w-7 shrink-0 rounded-full"
                />
                <span className="max-w-[8rem] truncate">{food.nameHe}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* F — More tracking: water + supplements, subordinate to food logging. */}
      <section>
        <SectionHeader title="מעקבים נוספים" />
        <div className="space-y-3">
          <WaterCard title="מעקב מים" />
          <SupplementsCard />
        </div>
      </section>

      {/* G — Tools / advanced: protein goal + the food catalog quick-add. The
          catalog is a *helper*, not authoritative nutrition truth — it's an image
          list of known foods with NO stored macros; you pick an item, then fill
          quantity + values yourself. So it sits quietly here, clearly framed,
          well below the primary "הוספה ליומן" actions. */}
      <section>
        <SectionHeader title="כלים נוספים" />
        <div className="space-y-3">
          <ProteinCalculator defaultOpen={false} showArticleLink />
          <Link
            href="/nutrition/library"
            className="tap flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-[border-color] hover:border-border-strong"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
              <DatabaseIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-foreground">
                הוסף מפריט קיים
              </span>
              <span className="block text-[11.5px] leading-snug text-muted">
                מאכלים מוכרים עם תמונה — בוחרים פריט, ממלאים כמות וערכים, ושומרים.
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* Calm transient confirmation. Fixed above the bottom nav, announced
          politely. Presentation only — no data is stored here. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }}
      >
        {flash && (
          <div className="animate-fade-up flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-foreground shadow-soft">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent-nutrition-soft)] text-[color:var(--accent-nutrition)]">
              <CheckIcon className="h-3 w-3" />
            </span>
            {flash}
          </div>
        )}
      </div>
    </div>
  );
}
