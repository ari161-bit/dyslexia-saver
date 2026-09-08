"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const COLOR_MAP = {
  1: "bg-chart-1/15 text-chart-1",
  2: "bg-chart-2/15 text-chart-2",
  3: "bg-chart-3/15 text-chart-3",
  4: "bg-chart-4/15 text-chart-4",
} as const;

export function StatCard({
  icon,
  value,
  label,
  color = 1,
  delay = 0,
}: {
  // A Server Component parent can't pass a component reference (e.g. the
  // Lucide icon itself) across the boundary — only already-rendered JSX.
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: 1 | 2 | 3 | 4;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3"
    >
      <span className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl [&_svg]:h-5 [&_svg]:w-5", COLOR_MAP[color])}>
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}
