import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  failed: "Needs attention",
};

export function ResourceCard({
  href,
  title,
  subject,
  status,
  tag,
}: {
  href: string;
  title: string;
  subject?: string | null;
  status: string;
  tag?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {status === "processing" || status === "uploading" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subject ?? "General"}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {tag ? <Badge variant="secondary" className="font-normal">{tag}</Badge> : null}
        {status !== "ready" ? (
          <Badge variant="outline" className="font-normal">
            {STATUS_LABEL[status] ?? status}
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}
