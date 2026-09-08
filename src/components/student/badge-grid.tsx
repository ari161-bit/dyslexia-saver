"use client";

import { motion } from "framer-motion";
import { Award, BookOpen, CalendarCheck, CalendarDays, CheckCircle2, Footprints, Lock } from "lucide-react";
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
      {badges.map((badge, i) => {
        const Icon = BADGE_ICONS[badge.id] ?? Award;
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.05 }}
            title={badge.description}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-colors",
              badge.earned
                ? "border-success/40 bg-gradient-to-b from-success/15 to-success/5 shadow-[0_0_16px_-4px_var(--success)]"
                : "border-border/60 bg-muted/30",
            )}
          >
            {!badge.earned ? (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground">
                <Lock className="h-2.5 w-2.5" />
              </span>
            ) : null}
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                badge.earned ? "bg-success/20 text-success" : "bg-muted text-muted-foreground/50",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <p className={cn("text-[11px] font-bold leading-tight", !badge.earned && "text-muted-foreground/60")}>{badge.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
