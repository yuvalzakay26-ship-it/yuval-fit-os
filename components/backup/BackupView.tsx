"use client";

import { useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  CheckCircleIcon,
  CopyIcon,
  DatabaseIcon,
  DownloadIcon,
  RefreshIcon,
  ShieldIcon,
  UploadIcon,
  WarningIcon,
} from "@/components/ui/icons";
import {
  BACKUP_MODULES,
  type Backup,
  type BackupErrorCode,
  type BackupPreview,
  backupFilename,
  createBackup,
  markExported,
  parseBackupJson,
  previewBackup,
  restoreBackup,
  serializeBackup,
  useBackupMeta,
} from "@/lib/backup";

/** Map a typed error to a calm Hebrew message (no panic language). */
function errorMessage(code: BackupErrorCode): string {
  switch (code) {
    case "invalid-json":
      return "קובץ הגיבוי לא תקין";
    case "not-fit-os":
      return "הקובץ לא נראה כמו גיבוי של Fit OS";
    case "unsupported-version":
      return "גרסת הגיבוי אינה נתמכת";
    case "missing-data":
      return "קובץ הגיבוי לא תקין";
    default:
      return "לא הצלחנו לקרוא את הקובץ";
  }
}

/** Friendly Hebrew date+time for a full ISO timestamp; "" when unparseable. */
function formatStamp(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return iso;
  }
}

function PreviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

const yesNo = (on: boolean) =>
  on ? (
    <span className="text-accent">כן</span>
  ) : (
    <span className="text-faint">לא</span>
  );

export function BackupView() {
  const meta = useBackupMeta();
  const [exportText, setExportText] = useState<string | null>(null);
  const [showExportText, setShowExportText] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const [pending, setPending] = useState<{
    backup: Backup;
    preview: BackupPreview;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [restored, setRestored] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------------------------ Export ------------------------------- */

  const handleExport = () => {
    const backup = createBackup();
    const text = serializeBackup(backup);
    setExportText(text);
    // Blob download — supported on modern mobile browsers; the copy/text
    // fallback below covers installed WebViews that block downloads.
    try {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backupFilename();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Download blocked — the user can still copy the text below.
      setShowExportText(true);
    }
    markExported();
  };

  const handleCopy = async () => {
    const text = exportText ?? serializeBackup(createBackup());
    setExportText(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — reveal the textarea so the user can select manually.
      setShowExportText(true);
    }
  };

  /* ------------------------------ Import ------------------------------- */

  const loadFromText = (text: string) => {
    setRestored(false);
    const result = parseBackupJson(text);
    if (!result.ok) {
      setPending(null);
      setError(errorMessage(result.error));
      return;
    }
    setError(null);
    setPending({ backup: result.backup, preview: previewBackup(result.backup) });
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      loadFromText(text);
    };
    reader.onerror = () => {
      setPending(null);
      setError("לא הצלחנו לקרוא את הקובץ");
    };
    reader.readAsText(file);
  };

  const cancelPending = () => {
    setPending(null);
    setError(null);
  };

  const doRestore = () => {
    if (!pending) return;
    const result = restoreBackup(pending.backup);
    setConfirming(false);
    if (!result.ok) {
      setError("לא הצלחנו לשמור את הנתונים במכשיר");
      return;
    }
    setPending(null);
    setError(null);
    setRestored(true);
  };

  const lastExported = formatStamp(meta.lastExportedAt);
  const lastRestored = formatStamp(meta.lastRestoredAt);

  return (
    <div className="space-y-8 pb-4">
      {/* ------------------------------ Hero ------------------------------ */}
      <Card variant="raised" className="sheen space-y-3">
        <div className="flex items-center gap-3">
          <span className="brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[color:var(--accent-contrast)] shadow-glow">
            <DatabaseIcon className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-foreground">
              גיבוי ושחזור
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
              שמור עותק פרטי של נתוני Fit OS במכשיר שלך.
            </p>
          </div>
        </div>
      </Card>

      {/* --------------------------- Trust card --------------------------- */}
      <Card className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
          <ShieldIcon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[13.5px] font-bold text-foreground">
            הנתונים נשמרים במכשיר הזה בלבד
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            הגיבוי כולל את הנתונים המקומיים במכשיר הזה בלבד — אימונים, תזונה, מים
            ותוספים — כקובץ JSON פרטי. הרשאות הבטא וניהול המשתמשים נשמרים במערכת
            הגישה ואינם חלק מהגיבוי.
          </p>
        </div>
      </Card>

      {/* ------------------------------ Export ---------------------------- */}
      <section>
        <SectionHeader title="ייצוא גיבוי" accent="var(--accent)" />
        <Card className="space-y-3.5">
          <div>
            <CardTitle>גיבוי הנתונים שלי</CardTitle>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              הנתונים נשמרים במכשיר הזה בלבד. מומלץ לייצא גיבוי מדי פעם כדי לא לאבד
              אימונים, תזונה, מים ותוספים.
            </p>
          </div>
          <Button onClick={handleExport} className="w-full">
            <DownloadIcon className="h-[18px] w-[18px]" /> ייצא גיבוי
          </Button>
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="flex-1"
            >
              <CopyIcon className="h-4 w-4" />
              {copied ? "הועתק" : "העתק טקסט גיבוי"}
            </Button>
            {exportText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportText((v) => !v)}
              >
                {showExportText ? "הסתר טקסט" : "הצג טקסט"}
              </Button>
            )}
          </div>
          {exportText && showExportText && (
            <Textarea
              readOnly
              dir="ltr"
              value={exportText}
              onFocus={(e) => e.currentTarget.select()}
              className="h-40 font-mono text-[11px] leading-relaxed"
              aria-label="טקסט הגיבוי"
            />
          )}
          {lastExported && (
            <p className="text-[12px] text-faint">גיבוי אחרון: {lastExported}</p>
          )}
        </Card>
      </section>

      {/* ------------------------------ Import ---------------------------- */}
      <section>
        <SectionHeader title="שחזור מגיבוי" accent="#ef4444" />
        <Card className="space-y-3.5">
          <div>
            <CardTitle>שחזור מגיבוי</CardTitle>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              ייבוא גיבוי יחליף את הנתונים הקיימים במכשיר הזה. מומלץ לייצא גיבוי
              נוכחי לפני שחזור.
            </p>
          </div>

          {/* Success state — restore done, prompt a reload. */}
          {restored ? (
            <div className="rounded-2xl border border-accent/30 bg-[color:var(--accent-soft)] p-4 text-center">
              <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-accent">
                <CheckCircleIcon className="h-6 w-6" filled />
              </span>
              <p className="text-[14px] font-bold text-foreground">
                הגיבוי שוחזר בהצלחה
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                רענן את הדף כדי לראות את הנתונים המשוחזרים בכל המסכים.
              </p>
              <Button
                className="mt-3 w-full"
                onClick={() => window.location.reload()}
              >
                <RefreshIcon className="h-[18px] w-[18px]" /> רענן עכשיו
              </Button>
            </div>
          ) : pending ? (
            /* Preview before applying — counts + explicit confirm. */
            <div className="rounded-2xl border border-border bg-surface-2 p-3.5">
              <p className="text-[13px] font-bold text-foreground">
                תצוגה מקדימה של הגיבוי
              </p>
              {pending.preview.isEmpty && (
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  הגיבוי הזה לא מכיל נתוני משתמש. שחזור שלו ינקה את הנתונים
                  הקיימים.
                </p>
              )}
              <div className="mt-1 divide-y divide-border">
                <PreviewRow
                  label="תאריך הגיבוי"
                  value={formatStamp(pending.preview.createdAt) || "לא ידוע"}
                />
                <PreviewRow
                  label="גרסת גיבוי"
                  value={pending.preview.backupVersion}
                />
                <PreviewRow label="אימונים" value={pending.preview.workouts} />
                <PreviewRow
                  label="רשומות תזונה"
                  value={pending.preview.nutritionEntries}
                />
                <PreviewRow label="ימי מים" value={pending.preview.waterDays} />
                <PreviewRow
                  label="תוספים"
                  value={pending.preview.supplements}
                />
                <PreviewRow
                  label="ביקורים במכון"
                  value={pending.preview.gymVisits}
                />
                <PreviewRow
                  label="כולל הגדרות"
                  value={yesNo(pending.preview.settingsIncluded)}
                />
                <PreviewRow
                  label="כולל שהייה פעילה במכון"
                  value={yesNo(pending.preview.activeGymVisitIncluded)}
                />
                <PreviewRow
                  label="כולל טיוטת אימון"
                  value={yesNo(pending.preview.activeDraftIncluded)}
                />
                <PreviewRow
                  label="כולל פרופיל אימון אישי"
                  value={yesNo(pending.preview.personalProfileIncluded)}
                />
              </div>
              <div className="mt-3.5 flex gap-2.5">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => setConfirming(true)}
                >
                  <UploadIcon className="h-[18px] w-[18px]" /> שחזר עכשיו
                </Button>
                <Button variant="secondary" onClick={cancelPending}>
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            /* Idle — pick a file or paste text. */
            <div className="space-y-3">
              <label className="tap flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface-2 px-4 py-3.5 text-[13px] font-semibold text-foreground hover:bg-surface">
                <UploadIcon className="h-[18px] w-[18px] text-accent" />
                בחר קובץ גיבוי
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    // Reset so re-selecting the same file fires onChange again.
                    e.target.value = "";
                    if (file) handleFile(file);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setPasteOpen((v) => !v)}
                className="tap block text-[12.5px] font-semibold text-accent"
              >
                {pasteOpen ? "סגור הדבקת טקסט" : "או הדבק טקסט גיבוי"}
              </button>
              {pasteOpen && (
                <div className="space-y-2.5">
                  <Textarea
                    dir="ltr"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder='{ "app": "Fit OS", ... }'
                    className="h-32 font-mono text-[11px] leading-relaxed"
                    aria-label="הדבקת טקסט גיבוי"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    disabled={pasteText.trim() === ""}
                    onClick={() => loadFromText(pasteText)}
                  >
                    טען מהטקסט
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-3 text-[12.5px] text-foreground">
              <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {lastRestored && !restored && (
            <p className="text-[12px] text-faint">שחזור אחרון: {lastRestored}</p>
          )}
        </Card>
      </section>

      {/* -------------------------- What's included ----------------------- */}
      <section>
        <SectionHeader title="מה נכלל בגיבוי" accent="var(--muted)" />
        <Card className="space-y-2.5">
          <p className="text-[12.5px] leading-relaxed text-muted">
            הגיבוי כולל את נתוני המשתמש שלך בלבד:
          </p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
            {BACKUP_MODULES.map((mod) => (
              <li
                key={mod.field}
                className="flex items-center gap-2 text-[12.5px] text-foreground"
              >
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-accent" />
                {mod.label}
              </li>
            ))}
          </ul>
          <p className="text-[12px] leading-relaxed text-faint">
            לא נכללים: מצב מסכי הגישה והפתיחה, נתוני דפדפן וכל מידע זמני שאינו נתוני
            משתמש.
          </p>
        </Card>
      </section>

      {/* ----------------------------- Data trust ------------------------- */}
      <section>
        <SectionHeader title="שאלות נפוצות" accent="var(--muted)" />
        <div className="space-y-2.5">
          <Card>
            <p className="text-[13px] font-bold text-foreground">מה נשמר?</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              אימונים, תזונה, מים, תוספים, מועדפים, ערכים שמורים, הגדרות ויעדים.
            </p>
          </Card>
          <Card>
            <p className="text-[13px] font-bold text-foreground">
              איפה הנתונים נשמרים?
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              במכשיר הזה בלבד (אחסון מקומי בדפדפן). מחיקת נתוני הדפדפן או מעבר
              למכשיר אחר עלולים למחוק אותם — לכן כדאי לגבות.
            </p>
          </Card>
          <Card>
            <p className="text-[13px] font-bold text-foreground">מתי כדאי לגבות?</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              מדי פעם, ובמיוחד לפני ניקוי הדפדפן, החלפת מכשיר או שחזור מגיבוי.
            </p>
          </Card>
          <Card>
            <p className="text-[13px] font-bold text-foreground">מה קורה בשחזור?</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              שחזור מחליף את נתוני Fit OS הקיימים במכשיר בנתונים שמהגיבוי. תמיד
              מוצגת תצוגה מקדימה ואישור לפני שמשהו נכתב.
            </p>
          </Card>
        </div>
      </section>

      <ConfirmDialog
        open={confirming}
        title="שחזור גיבוי"
        description="שחזור הגיבוי יחליף את הנתונים הקיימים במכשיר הזה. להמשיך?"
        confirmLabel="שחזר עכשיו"
        cancelLabel="ביטול"
        tone="danger"
        onConfirm={doRestore}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
