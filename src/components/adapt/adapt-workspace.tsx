"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdaptationPanel } from "./adaptation-panel";
import type { AdaptationType } from "@/lib/types/database";

const TYPES: { type: AdaptationType; label: string }[] = [
  { type: "accessible", label: "Accessible" },
  { type: "explain", label: "Explain" },
  { type: "vocabulary", label: "Vocabulary" },
  { type: "breakdown", label: "Break It Down" },
  { type: "audio", label: "Audio" },
  { type: "practice", label: "Practice" },
  { type: "revision", label: "Revision" },
];

export function AdaptWorkspace({
  resourceId,
  adaptations,
}: {
  resourceId: string;
  adaptations: Record<AdaptationType, { id: string; content: unknown; approved: boolean } | null>;
}) {
  const router = useRouter();

  return (
    <Tabs defaultValue="accessible">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
        <TabsList className="w-max min-w-full sm:w-fit">
          {TYPES.map((t) => (
            <TabsTrigger key={t.type} value={t.type} className="shrink-0">{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </div>
      {TYPES.map((t) => (
        <TabsContent key={t.type} value={t.type} className="pt-5">
          <AdaptationPanel
            resourceId={resourceId}
            type={t.type}
            initial={adaptations[t.type]}
            onAssign={() => router.push(`/teacher/assignments/new?resourceId=${resourceId}`)}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
