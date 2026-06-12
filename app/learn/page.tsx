import Link from "next/link";
import {
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_CATEGORY_LABELS,
} from "@/lib/knowledge-content";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BookOpenIcon, ChevronIcon, ClockIcon } from "@/components/ui/icons";

export default function LearnPage() {
  return (
    <div>
      <PageHeader
        title="מרכז ידע"
        subtitle="ידע קצר ופרקטי — אימון, תזונה, התקדמות והתאוששות"
      />
      <div className="space-y-3">
        {KNOWLEDGE_ARTICLES.map((article) => (
          <Link key={article.id} href={`/learn/${article.id}`} className="tap block">
            <Card className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-learn-soft)] text-[color:var(--accent-learn)]">
                <BookOpenIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-bold text-foreground">
                    {article.title}
                  </p>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">
                  {article.subtitle}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge tone="learn">
                    {KNOWLEDGE_CATEGORY_LABELS[article.category]}
                  </Badge>
                  <Badge tone="muted">
                    <ClockIcon className="h-3 w-3" />
                    {article.readingTimeMinutes} דק׳ קריאה
                  </Badge>
                </div>
              </div>
              <ChevronIcon className="h-4 w-4 shrink-0 text-faint" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
