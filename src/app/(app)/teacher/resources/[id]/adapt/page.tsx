import { notFound } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AdaptWorkspace } from "@/components/adapt/adapt-workspace";
import { getAdaptations, getResource } from "@/lib/data/resources";
import type { AdaptationType } from "@/lib/types/database";

const TYPES: AdaptationType[] = ["accessible", "explain", "vocabulary", "breakdown", "audio", "practice", "revision"];

export default async function AdaptResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await getResource(id);
  if (!resource) notFound();

  const adaptations = await getAdaptations(id);
  const latestByType = {} as Record<AdaptationType, { id: string; content: unknown; approved: boolean } | null>;
  for (const type of TYPES) {
    const match = adaptations.find((a) => a.type === type);
    latestByType[type] = match ? { id: match.id, content: match.content, approved: match.approved } : null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={resource.title} description="Preview each adaptation before publishing it to students." />

      {resource.status === "processing" ? (
        <Card><CardContent className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Still processing this file...</CardContent></Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <FileText className="h-4 w-4" /> Original Material
            </p>
            <div className="max-h-[70vh] overflow-y-auto whitespace-pre-line rounded-xl bg-secondary/40 p-4 text-sm leading-relaxed">
              {resource.extracted_text || "No text extracted yet."}
            </div>
          </CardContent>
        </Card>

        <div>
          <AdaptWorkspace resourceId={id} adaptations={latestByType} />
        </div>
      </div>
    </div>
  );
}
