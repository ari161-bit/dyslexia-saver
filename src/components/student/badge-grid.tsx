import { Award, BookOpen, CalendarCheck, CalendarDays, CheckCircle2, Footprints } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StudentBadge } from "@/lib/data/student";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<string, LucideIcon> = {
  first_steps: Footprints,
  getting_started: CheckCircle2,
  bookworm: BookOpen,
  streak_3: CalendarCheck,
  streak_7: CalendarDays,
  assignment_ace: Award,
};

export function BadgeGrid({ badges }: { badges: StudentBadge[] }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {badges.map((badge) => {
        const Icon = BADGE_ICONS[badge.id] ?? Award;
        return (
          <div
            key={badge.id}
            title={badge.description}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-opacity",
              badge.earned ? "border-success/40 bg-success/10" : "border-border/60 bg-muted/30 opacity-40",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                badge.earned ? "bg-success/20 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <p className="text-[11px] font-bold leading-tight">{badge.label}</p>
          </div>
        );
      })}
    </div>
  );
}
