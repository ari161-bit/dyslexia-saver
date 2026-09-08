"use client";

import { useEffect, useState } from "react";

export function CompletionRing({ percent }: { percent: number }) {
  const [animated, setAnimated] = useState(0);
  const clamped = Math.min(100, Math.max(0, percent));

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div
      className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full transition-[background] duration-1000 ease-out"
      style={{
        background: `conic-gradient(var(--chart-1) ${animated * 3.6}deg, var(--secondary) ${animated * 3.6}deg)`,
      }}
    >
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-card">
        <span className="text-xl font-bold">{clamped}%</span>
      </div>
    </div>
  );
}
