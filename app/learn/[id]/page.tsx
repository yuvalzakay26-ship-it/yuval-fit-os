import Link from "next/link";
import { notFound } from "next/navigation";
import {
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_CATEGORY_LABELS,
  NUTRITION_DISCLAIMER,
  getKnowledgeArticle,
} from "@/lib/knowledge-content";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronIcon, ClockIcon, SparkIcon } from "@/components/ui/icons";
import { ProteinCalculator } from "@/components/nutrition/ProteinCalculator";

export function generateStaticParams() {
  return KNOWLEDGE_ARTICLES.map((article) => ({ id: article.id }));
}

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = getKnowledgeArticle(id);
  if (!article) notFound();

  return (
    <div>
      <Link
        href="/learn"
        className="tap mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent-learn)]"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        מרכז ידע
      </Link>

      <PageHeader title={article.title} subtitle={article.subtitle} className="mb-4" />

      <div className="mb-5 flex items-center gap-1.5">
        <Badge tone="learn">{KNOWLEDGE_CATEGORY_LABELS[article.category]}</Badge>
        <Badge tone="muted">
          <ClockIcon className="h-3 w-3" />
          {article.readingTimeMinutes} דק׳ קריאה
        </Badge>
      </div>

      <div className="space-y-3.5">
        {article.sections.map((section) => (
          <Card key={section.title} className="space-y-2 p-4">
            <CardTitle>{section.title}</CardTitle>
            <p className="text-[13.5px] leading-relaxed text-muted">{section.body}</p>
            {section.practicalTip && (
              <div className="flex items-start gap-2 rounded-2xl bg-[color:var(--accent-learn-soft)] p-3">
                <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent-learn)]" />
                <p className="text-[12.5px] leading-relaxed text-foreground">
                  <span className="font-bold text-[color:var(--accent-learn)]">טיפ מעשי: </span>
                  {section.practicalTip}
                </p>
              </div>
            )}
          </Card>
        ))}

        {article.tool === "protein-calculator" && <ProteinCalculator />}

        {article.showDisclaimer && article.tool !== "protein-calculator" && (
          <p className="px-1 text-[11px] leading-relaxed text-faint">
            {NUTRITION_DISCLAIMER}
          </p>
        )}
      </div>
    </div>
  );
}
