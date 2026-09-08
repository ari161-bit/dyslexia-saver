"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import type { EngagementWeek } from "@/lib/data/school";

export function WeeklyTrendChart({ trend }: { trend: EngagementWeek[] }) {
  const max = Math.max(1, ...trend.map((w) => w.activeStudents));

  return (
    <div className="flex h-32 items-end gap-2">
      {trend.map((w, i) => (
        <div key={w.weekStart} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-24 w-full items-end overflow-hidden rounded-t-md bg-chart-1/10">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (w.activeStudents / max) * 100)}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-t-md bg-gradient-to-t from-chart-1 to-chart-1/70"
              title={`${w.activeStudents} active students`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{format(new Date(w.weekStart), "MMM d")}</span>
        </div>
      ))}
    </div>
  );
}
