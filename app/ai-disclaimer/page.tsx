import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  InfoSection,
  InfoList,
  PlainLanguageNote,
} from "@/components/legal/InfoSection";

export const metadata = {
  title: "הבהרת AI ותזונה · Fit OS",
};

/**
 * /ai-disclaimer — "הבהרת AI ותזונה". Explains, calmly and without shaming,
 * that the photo-scan AI is an estimate-only draft the user must review and
 * confirm before anything is saved. Tone is deliberately safe and supportive:
 * no "good/bad foods", no body pressure, no medical framing.
 */
export default function AiDisclaimerPage() {
  return (
    <div className="pb-4">
      <PageHeader
        title="הבהרת AI ותזונה"
        subtitle="איך עובד ניתוח התמונה ולמה הוא תמיד הערכה"
      />

      <div className="space-y-4">
        <PlainLanguageNote>
          מסמך זה נועד להסביר בשפה פשוטה איך ניתוח ה־AI עובד. הוא אינו מהווה ייעוץ
          משפטי, רפואי או תזונתי.
        </PlainLanguageNote>

        <InfoSection title="התוצאה היא הערכה בלבד">
          <p>
            ניתוח תמונת האוכל מבוסס על בינה מלאכותית ונועד לחסוך לך הקלדה. התוצאה
            היא הערכה בלבד — היא יכולה לטעות בזיהוי המאכל, בכמות, בקלוריות, בחלבון,
            בפחמימות, בשומן או בערכים אחרים.
          </p>
        </InfoSection>

        <InfoSection title="טיוטה לעריכה — אתה מאשר לפני שמירה">
          <p>
            מה שה־AI מחזיר הוא טיוטה לעריכה, לא רישום סופי. המערכת בנויה כך
            שתמיד:
          </p>
          <InfoList
            items={[
              "התוצאה מוצגת כטיוטה שניתן לערוך",
              "אתה בודק ומתקן את הערכים לפי הצורך",
              "המשתמש מאשר לפני שמירה — שום דבר לא נשמר ליומן באופן אוטומטי",
            ]}
          />
          <p>
            כך אתה תמיד נשאר בשליטה על מה שנכנס בסופו של דבר ליומן התזונה שלך.
          </p>
        </InfoSection>

        <InfoSection title="זה לא ייעוץ רפואי או תוכנית תזונה">
          <p>
            התכונה הזו היא כלי עזר לרישום, ולא ייעוץ רפואי או תוכנית תזונה. אין
            להשתמש בה לצורך החלטות רפואיות, התמודדות עם אלרגיות, הפרעות אכילה,
            תזונה קלינית או כל מצב שדורש ליווי מקצועי.
          </p>
          <p>
            לכל שאלה או צורך כזה, כדאי לפנות לאיש מקצוע מוסמך שמכיר אותך.
          </p>
        </InfoSection>

        <InfoSection title="בלי לחץ ובלי שיפוט">
          <p>
            Fit OS לא מדרגת אוכל כ„טוב” או כ„רע” ולא נועדה ליצור לחץ. המספרים הם
            כלי עזר לארגון ולמעקב בלבד — השתמש בהם בקצב ובאופן שמתאים לך.
          </p>
        </InfoSection>

        <p className="px-1 pt-1 text-center text-[12px] text-faint">
          ראה גם{" "}
          <Link href="/privacy" className="font-semibold text-accent underline">
            מדיניות פרטיות
          </Link>{" "}
          ו־
          <Link href="/terms" className="font-semibold text-accent underline">
            תנאי שימוש
          </Link>
        </p>
      </div>
    </div>
  );
}
