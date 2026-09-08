import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning-foreground",
  submitted: "bg-accent text-accent-foreground",
  reviewed: "bg-success/20 text-success",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

export function AssignmentRow({
  href,
  title,
  subject,
  className,
  dueDate,
  status,
}: {
  href: string;
  title: string;
  subject?: string | null;
  className: string;
  dueDate: string | null;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-2xl border-2 border-border/70 bg-card px-4 py-4 transition-all hover:scale-[1.01] hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="min-w-0">
        <p className="truncate text-base font-bold">{title}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {className}
          {subject ? ` · ${subject}` : ""}
          {dueDate ? ` · Due ${format(new Date(dueDate), "MMM d")}` : ""}
        </p>
      </div>
      <Badge className={cn("shrink-0 border-none px-3 py-1 text-sm font-semibold", STATUS_STYLE[status])}>
        {STATUS_LABEL[status] ?? status}
      </Badge>
    </Link>
  );
}
