import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  InfoSection,
  InfoList,
  PlainLanguageNote,
} from "@/components/legal/InfoSection";

export const metadata = {
  title: "תנאי שימוש ובטא · Fit OS",
};

/**
 * /terms — "תנאי שימוש ובטא". A calm, plain-language note about what Fit OS is
 * today: a personal tracking tool in beta. It sets expectations (bugs, change,
 * keep backups) and is explicit that the app is not medical / nutrition /
 * fitness advice. No aggressive legal language, no behaviour changes.
 */
export default function TermsPage() {
  return (
    <div className="pb-4">
      <PageHeader
        title="תנאי שימוש ובטא"
        subtitle="כמה דברים חשובים לדעת על השימוש במערכת"
      />

      <div className="space-y-4">
        <PlainLanguageNote>
          מסמך זה נועד להסביר בשפה פשוטה איך המערכת עובדת ומה כדאי לדעת לפני
          השימוש. הוא אינו מהווה ייעוץ משפטי.
        </PlainLanguageNote>

        <InfoSection title="המערכת נמצאת בבטא">
          <p>
            Fit OS היא כרגע מוצר בבטא ובפיתוח מתמשך. אנחנו משתדלים שהכל יעבוד טוב,
            אבל ייתכנו באגים, תקלות, תכונות חסרות, אובדן נתונים או חישובים לא
            מדויקים.
          </p>
          <p>
            המערכת עשויה להשתנות עם הזמן — תכונות יכולות להתווסף, להשתנות או
            להיעלם.
          </p>
        </InfoSection>

        <InfoSection title="שמור גיבויים">
          <p>
            כדי להפחית סיכון לאובדן מידע, מומלץ לשמור גיבוי מעת לעת דרך תכונת{" "}
            <Link href="/backup" className="font-semibold text-accent underline">
              הגיבוי והשחזור
            </Link>
            . כך תוכל לשחזר את הנתונים שלך גם אם משהו משתבש.
          </p>
        </InfoSection>

        <InfoSection title="המערכת היא כלי למעקב אישי בלבד">
          <p>
            Fit OS נועדה לעזור לך לעקוב ולארגן מידע אישי על אימונים ותזונה. היא
            אינה תחליף לייעוץ מקצועי, וזה לא:
          </p>
          <InfoList
            items={[
              "ייעוץ רפואי",
              "ייעוץ תזונתי",
              "אימון או הדרכת כושר אישית",
              "אבחון או טיפול",
            ]}
          />
          <p>
            לכל החלטה שקשורה לבריאות, תזונה או אימון — כדאי להשתמש בשיקול דעת
            ולהתייעץ עם איש מקצוע מוסמך.
          </p>
        </InfoSection>

        <InfoSection title="גישה לבטא">
          <p>
            הגישה לבטא ניתנת לפי אישור. הגישה יכולה להתקבל, להיחסם או להישלל על ידי
            מנהל המערכת. אנחנו משתדלים לנהל את זה בהוגנות, אך אין התחייבות לזמינות
            רציפה של הגישה בשלב הבטא.
          </p>
        </InfoSection>

        <InfoSection title="פרטיות ו־AI">
          <p>
            למידע על אופן שמירת הנתונים ראה{" "}
            <Link href="/privacy" className="font-semibold text-accent underline">
              מדיניות פרטיות
            </Link>
            , ולמידע על ניתוח תמונות האוכל ראה{" "}
            <Link
              href="/ai-disclaimer"
              className="font-semibold text-accent underline"
            >
              הבהרת AI ותזונה
            </Link>
            .
          </p>
        </InfoSection>
      </div>
    </div>
  );
}
