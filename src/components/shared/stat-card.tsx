"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (prefersReducedMotion.current || !Number.isFinite(target)) {
      setValue(target);
      return;
    }
    let frame: number;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  delay = 0,
}: {
  label: string;
  value: string | number;
  // A Server Component parent can't pass a component reference (e.g. the
  // Lucide icon itself) across the boundary — only already-rendered JSX.
  icon: React.ReactNode;
  hint?: string;
  delay?: number;
}) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const display = typeof value === "number" ? animated : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="border-border/70">
        <CardContent className="flex items-start justify-between gap-3 py-1">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{display}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground [&_svg]:h-5 [&_svg]:w-5">
            {icon}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}
