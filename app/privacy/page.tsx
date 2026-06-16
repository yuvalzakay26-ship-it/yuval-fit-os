import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  InfoSection,
  InfoList,
  PlainLanguageNote,
} from "@/components/legal/InfoSection";
import { ChatIcon, PhoneIcon } from "@/components/ui/icons";

export const metadata = {
  title: "מדיניות פרטיות · Fit OS",
};

/** WhatsApp deep link to Yuval (international format, no plus) — mirrors the app. */
const WHATSAPP_URL = "https://wa.me/972533339341";
const PHONE_TEL = "tel:+972533339341";
const PHONE_DISPLAY = "053-333-9341";

/**
 * /privacy — "מדיניות פרטיות". A plain-language explanation of how Fit OS
 * handles data in its current (local-first, beta) state. It is purely
 * informational: it reads no storage, calls no API, and changes nothing. The
 * wording is intentionally careful — it describes how the system is built today
 * and avoids absolute privacy guarantees or legal-compliance claims.
 */
export default function PrivacyPage() {
  return (
    <div className="pb-4">
      <PageHeader
        title="מדיניות פרטיות"
        subtitle="איך Fit OS שומרת ומשתמשת בנתונים שלך, בשפה פשוטה"
      />

      <div className="space-y-4">
        <PlainLanguageNote>
          מסמך זה נועד להסביר בשפה פשוטה איך המערכת עובדת. הוא אינו מהווה ייעוץ
          משפטי. Fit OS נמצאת בשלב פיתוח ובטא, ולכן הדברים כאן מתארים את מצב
          המערכת הנוכחי ועשויים להשתנות עם הזמן.
        </PlainLanguageNote>

        <InfoSection title="הנתונים נשמרים קודם כל אצלך במכשיר">
          <p>
            Fit OS בנויה כמערכת מקומית (local-first). המשמעות היא שרוב הנתונים
            האישיים שלך נשמרים כרגע בעיקר על המכשיר שלך, בתוך אחסון מקומי של
            הדפדפן/האפליקציה (localStorage), ולא בשרת מרוחק.
          </p>
          <p>בין השאר נשמרים מקומית:</p>
          <InfoList
            items={[
              "אימונים ותבניות אימון",
              "יומן תזונה וערכי מאקרו",
              "מעקב שתיית מים",
              "תוספים שהגדרת",
              "נוכחות וכניסות למכון",
              "הגדרות אישיות והעדפות",
              "קבצי גיבוי שנוצרו במכשיר",
            ]}
          />
        </InfoSection>

        <InfoSection title="מחיקת נתוני הדפדפן עלולה למחוק את המידע">
          <p>
            מכיוון שהמידע נשמר במכשיר, ניקוי נתוני הדפדפן או האפליקציה, מחיקת
            ההתקנה, או שימוש במצב גלישה פרטית עלולים למחוק את הנתונים המקומיים.
          </p>
          <p>
            לכן המערכת בנויה כך שתוכל לייצא{" "}
            <Link href="/backup" className="font-semibold text-accent underline">
              גיבוי
            </Link>{" "}
            — קובץ JSON שמכיל את הנתונים שלך — ולשמור אותו במקום בטוח. אם לא יצרת
            גיבוי, ייתכן שלא נוכל לשחזר מידע שנמחק.
          </p>
        </InfoSection>

        <InfoSection title="התחברות עם Google ובקרת גישה לבטא">
          <p>
            ההתחברות לבטא מתבצעת דרך Supabase Auth (כולל אפשרות התחברות עם Google
            או קישור כניסה לאימייל). מטרת ההתחברות היא לזהות מי רשאי להשתמש בבטא.
          </p>
          <p>
            לפי מצב המערכת הנוכחי, Supabase עשוי לשמור מידע בסיסי שקשור לחשבון
            ולגישה, כגון:
          </p>
          <InfoList
            items={[
              "כתובת אימייל",
              "שם תצוגה או ספק התחברות, אם זמין",
              "סטטוס גישה (מאושר / חסום)",
              "סטטוס בקשת גישה לבטא",
              "סטטוס מנהל, היכן שרלוונטי",
            ]}
          />
          <p>
            הנתונים האישיים של כושר ותזונה (אימונים, יומן אוכל, מים, תוספים,
            נוכחות במכון ועוד) אינם מסונכרנים כרגע ל־Supabase, ונשארים במכשיר שלך.
          </p>
        </InfoSection>

        <InfoSection title="מצב אורח">
          <p>
            כניסה כאורח שומרת נתונים על המכשיר/הדפדפן הנוכחי בלבד. במצב אורח לא
            נוצר חשבון ולא נפתחת התחברות (session) ב־Supabase, ולא נשמר עבורך מידע
            חשבון בצד השרת.
          </p>
        </InfoSection>

        <InfoSection title="סריקת תמונת אוכל וניתוח AI">
          <p>
            כשתכונת סריקת התמונה פעילה ובוחרים להשתמש בה, התמונה שנבחרה נשלחת
            למסלול ניתוח בצד השרת לצורך ניתוח בלבד, כדי לבנות טיוטת תזונה לעריכה.
          </p>
          <p>
            המערכת בנויה כך שהתמונה אינה נשמרת באופן מכוון ב־localStorage,
            ב־Supabase, בבסיס נתונים או בדיסק. עם זאת, איננו יכולים להבטיח באופן
            מוחלט מה כל שירות חיצוני עושה עם נתונים, ולכן איננו מתחייבים שהתמונה
            לעולם לא תישמר בשום מקום על ידי אף צד שלישי.
          </p>
          <p>
            תוצאות הניתוח הן הערכה בלבד וטיוטה לעריכה. למידע נוסף ראה{" "}
            <Link
              href="/ai-disclaimer"
              className="font-semibold text-accent underline"
            >
              הבהרת AI ותזונה
            </Link>
            .
          </p>
        </InfoSection>

        <InfoSection title="יצירת קשר">
          <p>
            אם יש לך שאלה לגבי המידע הזה או בקשה כלשהי, אפשר לפנות ישירות:
          </p>
          <div className="space-y-2 pt-1">
            <a
              href={PHONE_TEL}
              className="tap flex items-center gap-3 rounded-2xl border border-border bg-surface-2/70 px-4 py-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
                <PhoneIcon className="h-[17px] w-[17px]" />
              </span>
              <span dir="ltr" className="text-[13.5px] font-semibold">
                {PHONE_DISPLAY}
              </span>
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tap flex items-center gap-3 rounded-2xl border border-border bg-surface-2/70 px-4 py-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-accent">
                <ChatIcon className="h-[17px] w-[17px]" />
              </span>
              <span className="text-[13.5px] font-semibold">WhatsApp</span>
            </a>
          </div>
        </InfoSection>

        <p className="px-1 pt-1 text-center text-[12px] text-faint">
          ראה גם{" "}
          <Link href="/terms" className="font-semibold text-accent underline">
            תנאי שימוש ובטא
          </Link>
        </p>
      </div>
    </div>
  );
}
